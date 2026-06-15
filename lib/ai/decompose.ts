import { formatISO } from 'date-fns';
import { z } from 'zod';

import { getLlmProviderConfig, getLanguageModel } from '@/lib/ai/provider';
import { createCreateSubtasksTool } from '@/lib/ai/tools';
import { getTask } from '@/lib/repo/tasks';
import type { Subtask, Task } from '@/lib/schema';

const claritySchema = z.object({
  isClear: z.boolean(),
  questions: z.array(z.string().trim().min(1)).max(10).optional(),
  proposedSubtasks: z.array(z.string().trim().min(1).max(200)).min(1).max(20).optional(),
});

export type DecomposeResult =
  | {
      kind: 'questions';
      taskId: string;
      taskTitle: string;
      questions: string[];
      generatedAt: string;
      provider: ReturnType<typeof getLlmProviderConfig>['provider'];
      isMock: boolean;
    }
  | {
      kind: 'proposal';
      taskId: string;
      taskTitle: string;
      proposedSubtasks: string[];
      generatedAt: string;
      provider: ReturnType<typeof getLlmProviderConfig>['provider'];
      isMock: boolean;
    }
  | {
      kind: 'created';
      taskId: string;
      taskTitle: string;
      subtasks: Subtask[];
      generatedAt: string;
      provider: ReturnType<typeof getLlmProviderConfig>['provider'];
      isMock: boolean;
    };

const CLASSIFY_SYSTEM = `You are a task decomposition assistant for DevLog.

Step 1 is clarity classification only — do NOT assume subtasks will be saved yet.

Rules:
- If the task title/description lacks concrete scope, deliverable, or done criteria → isClear=false and return 2-4 focused clarifying questions.
- If the task is actionable → isClear=true and return 3-7 proposedSubtasks as short imperative titles.
- proposedSubtasks must be independently completable and ordered for momentum.
- Never return both questions and proposedSubtasks.`;

const CREATE_SYSTEM = `You persist user-approved subtasks via the createSubtasks tool.

Call createSubtasks exactly once with the provided taskId and subtask titles.
Do not invent extra subtasks beyond the approved list.`;

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
    system: CLASSIFY_SYSTEM,
    output: Output.object({ schema: claritySchema }),
    prompt: buildClassifyPrompt(task, answers),
  });

  if (!output) {
    throw new Error('Failed to classify task clarity');
  }

  return output;
}

async function persistApprovedSubtasks(
  task: Task,
  subtasks: string[],
): Promise<Subtask[]> {
  const { generateText, stepCountIs } = await import('ai');

  const createSubtasks = createCreateSubtasksTool();

  const { toolResults } = await generateText({
    model: getLanguageModel(),
    system: CREATE_SYSTEM,
    prompt: `User confirmed subtask creation for task "${task.title}" (${task.id}).

Approved subtasks:
${subtasks.map((title, index) => `${index + 1}. ${title}`).join('\n')}

Call createSubtasks now.`,
    tools: { createSubtasks },
    stopWhen: stepCountIs(3),
  });

  const created = toolResults
    .filter((result) => result.toolName === 'createSubtasks')
    .flatMap((result) => {
      const payload = result.output as { subtasks?: Subtask[] } | undefined;
      return payload?.subtasks ?? [];
    });

  if (created.length > 0) {
    return created;
  }

  const { createSubtasksForTask } = await import('@/lib/repo/subtasks');
  return createSubtasksForTask(task.id, subtasks);
}

export async function decomposeTask(input: {
  taskId: string;
  confirm?: boolean;
  subtasks?: string[];
  answers?: string[];
}): Promise<DecomposeResult> {
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

    const created = await persistApprovedSubtasks(task, input.subtasks);

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
