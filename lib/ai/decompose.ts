import { formatISO } from 'date-fns';
import { z } from 'zod';

import {
  getLanguageModel,
  getLlmProviderConfig,
  getLlmProviderOptions,
} from '@/lib/ai/provider';
import { createSubtasksForTask } from '@/lib/repo/subtasks';
import { getTask } from '@/lib/repo/tasks';
import type { Task } from '@/lib/schema';
import type { DecomposeResponse } from '@/lib/types/agent';

const claritySchema = z.object({
  isClear: z.boolean(),
  questions: z.array(z.string().trim().min(1)).max(10).optional(),
  proposedSubtasks: z.array(z.string().trim().min(1).max(200)).min(1).max(20).optional(),
});

const CLASSIFY_SYSTEM = `You are a task decomposition assistant for DevLog.

Step 1 is clarity classification only — do NOT assume subtasks will be saved yet.

Rules:
- If the task title/description lacks concrete scope, deliverable, or done criteria → isClear=false and return 2-4 focused clarifying questions.
- If the task is actionable → isClear=true and return 3-7 proposedSubtasks as short imperative titles.
- proposedSubtasks must be independently completable and ordered for momentum.
- Never return both questions and proposedSubtasks.`;

function buildClassifyPrompt(task: Task, answers?: string[]): string {
  const lines = [
    'Classify whether this task is clear enough to decompose.',
    '',
    `Task ID: ${task.id}`,
    `Title: ${task.title}`,
    `Description: ${task.description || '(empty)'}`,
    `Status: ${task.status}`,
    `Priority: ${task.priority}`,
  ];

  if (answers && answers.length > 0) {
    lines.push('', 'User clarifications:', ...answers.map((answer, index) => `${index + 1}. ${answer}`));
  }

  return lines.join('\n');
}

export function normalizeClarityOutput(output: z.infer<typeof claritySchema>) {
  if (!output.isClear) {
    const questions = output.questions?.filter(Boolean) ?? [];

    if (questions.length === 0) {
      return {
        isClear: false as const,
        questions: [
          'What is the concrete deliverable?',
          'What constraints or dependencies should we respect?',
          'What does done look like?',
        ],
      };
    }

    return { isClear: false as const, questions };
  }

  const proposedSubtasks = output.proposedSubtasks?.filter(Boolean) ?? [];

  if (proposedSubtasks.length === 0) {
    return {
      isClear: true as const,
      proposedSubtasks: [
        'Clarify scope and acceptance criteria',
        'Implement the core workflow',
        'Add validation, tests, and documentation',
      ],
    };
  }

  return { isClear: true as const, proposedSubtasks };
}

async function analyzeTaskClarity(
  task: Task,
  answers?: string[],
): Promise<z.infer<typeof claritySchema>> {
  const { generateText, Output } = await import('ai');

  const { output } = await generateText({
    model: getLanguageModel(),
    providerOptions: getLlmProviderOptions(),
    system: CLASSIFY_SYSTEM,
    output: Output.object({ schema: claritySchema }),
    prompt: buildClassifyPrompt(task, answers),
  });

  if (!output) {
    throw new Error('Failed to classify task clarity');
  }

  return output;
}

export async function decomposeTask(input: {
  taskId: string;
  confirm?: boolean;
  subtasks?: string[];
  answers?: string[];
}): Promise<DecomposeResponse> {
  const providerConfig = getLlmProviderConfig();
  const generatedAt = formatISO(new Date());
  const meta = {
    generatedAt,
    provider: providerConfig.provider,
    isMock: providerConfig.isMock,
  };

  const task = getTask(input.taskId);

  if (!task) {
    throw new Error('Task not found');
  }

  if (input.confirm) {
    if (!input.subtasks || input.subtasks.length === 0) {
      throw new Error('subtasks are required when confirm is true');
    }

    const created = createSubtasksForTask(task.id, input.subtasks);

    return {
      kind: 'created',
      taskId: task.id,
      taskTitle: task.title,
      subtasks: created,
      ...meta,
    };
  }

  const raw = await analyzeTaskClarity(task, input.answers);
  const clarity = normalizeClarityOutput(raw);

  if (!clarity.isClear) {
    return {
      kind: 'questions',
      taskId: task.id,
      taskTitle: task.title,
      questions: clarity.questions,
      ...meta,
    };
  }

  return {
    kind: 'proposal',
    taskId: task.id,
    taskTitle: task.title,
    proposedSubtasks: clarity.proposedSubtasks,
    ...meta,
  };
}
