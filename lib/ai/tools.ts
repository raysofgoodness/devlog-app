import { differenceInCalendarDays, formatISO, parseISO } from 'date-fns';
import { tool } from 'ai';
import { z } from 'zod';

import { scoreAndRankTasks } from '@/lib/ai/prioritize';
import { createSubtasksForTask } from '@/lib/repo/subtasks';
import { getTask, listTasks } from '@/lib/repo/tasks';
import type { Task } from '@/lib/schema';

export const prioritizeToolInputSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
});

export const detectStaleToolInputSchema = z.object({
  staleDays: z.number().int().min(1).max(90).optional().default(3),
});

export const statusUpdateToneSchema = z.enum(['professional', 'casual', 'concise']);

export const draftStatusUpdateToolInputSchema = z.object({
  taskId: z.uuid().optional(),
  tone: statusUpdateToneSchema.optional().default('professional'),
});

export const createSubtasksToolInputSchema = z.object({
  taskId: z.uuid(),
  subtasks: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
      }),
    )
    .min(1)
    .max(20),
});

export interface StaleTaskSummary {
  taskId: string;
  title: string;
  priority: Task['priority'];
  status: Task['status'];
  createdAt: string;
  statusUpdatedAt: string;
  daysInProgress: number;
}

export function detectStaleTasks(
  tasks: Task[],
  options: { staleDays: number; now?: string },
): StaleTaskSummary[] {
  const now = options.now ? parseISO(options.now) : new Date();

  return tasks
    .filter((task) => task.status === 'in-progress')
    .map((task) => ({
      task,
      daysInProgress: Math.max(
        0,
        differenceInCalendarDays(now, parseISO(task.statusUpdatedAt)),
      ),
    }))
    .filter((entry) => entry.daysInProgress >= options.staleDays)
    .toSorted((left, right) => right.daysInProgress - left.daysInProgress)
    .map(({ task, daysInProgress }) => ({
      taskId: task.id,
      title: task.title,
      priority: task.priority,
      status: task.status,
      createdAt: task.createdAt,
      statusUpdatedAt: task.statusUpdatedAt,
      daysInProgress,
    }));
}

function draftStatusText(task: Task, tone: z.infer<typeof statusUpdateToneSchema>): string {
  switch (tone) {
    case 'casual':
      return `Hey team — still chipping away at **${task.title}** (${task.priority} priority). In progress; will share when there's a meaningful bump.`;
    case 'concise':
      return `**${task.title}** — in progress (${task.priority}).`;
    default:
      return `**Status update:** Continuing work on "${task.title}" (${task.priority} priority, in progress). Next step is to close the remaining scope and post a short demo note when ready.`;
  }
}

function draftTeamStatusText(
  tasks: Task[],
  tone: z.infer<typeof statusUpdateToneSchema>,
): string {
  const active = tasks.filter((task) => task.status === 'in-progress');

  if (active.length === 0) {
    return tone === 'casual'
      ? 'No in-progress tasks right now — picking up the next item from the backlog.'
      : 'No tasks are currently in progress. Ready to pull the next priority item.';
  }

  const lines = active.slice(0, 5).map((task) => `- ${task.title} (${task.priority})`);

  if (tone === 'casual') {
    return `Quick pulse — here's what's moving:\n${lines.join('\n')}`;
  }

  if (tone === 'concise') {
    return `In progress:\n${lines.join('\n')}`;
  }

  return `**Team status**\n${lines.join('\n')}\n\nFocus: finish in-flight work before starting new threads.`;
}

export function createPrioritizeTool() {
  return tool({
    description:
      'Score active tasks with the deterministic DevLog formula and return a ranked list for daily planning.',
    inputSchema: prioritizeToolInputSchema,
    execute: async ({ limit }: z.infer<typeof prioritizeToolInputSchema>) => {
      const generatedAt = formatISO(new Date());
      const scored = scoreAndRankTasks(listTasks(), { now: generatedAt });
      const limited = limit ? scored.slice(0, limit) : scored;

      return {
        generatedAt,
        count: limited.length,
        tasks: limited.map(({ task, score, rank }) => ({
          taskId: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          createdAt: task.createdAt,
          score,
          rank,
        })),
      };
    },
  });
}

export function createDetectStaleTool() {
  return tool({
    description:
      'Find in-progress tasks stuck longer than the stale threshold (by days since statusUpdatedAt).',
    inputSchema: detectStaleToolInputSchema,
    execute: async ({ staleDays }: z.infer<typeof detectStaleToolInputSchema>) => {
      const generatedAt = formatISO(new Date());
      const staleTasks = detectStaleTasks(listTasks(), {
        staleDays,
        now: generatedAt,
      });

      return {
        generatedAt,
        staleDays,
        count: staleTasks.length,
        staleTasks,
      };
    },
  });
}

export function createDraftStatusUpdateTool() {
  return tool({
    description:
      'Draft a tone-aware Slack-style status update for a task or the current in-progress workload.',
    inputSchema: draftStatusUpdateToolInputSchema,
    execute: async ({
      taskId,
      tone,
    }: z.infer<typeof draftStatusUpdateToolInputSchema>) => {
      if (taskId) {
        const task = getTask(taskId);

        if (!task) {
          throw new Error('Task not found');
        }

        return {
          taskId: task.id,
          tone,
          draft: draftStatusText(task, tone),
        };
      }

      return {
        tone,
        draft: draftTeamStatusText(listTasks(), tone),
      };
    },
  });
}

export function createCreateSubtasksTool() {
  return tool({
    description:
      'Persist approved subtasks for a parent task. Call only after the user explicitly confirmed creation.',
    inputSchema: createSubtasksToolInputSchema,
    execute: async ({
      taskId,
      subtasks,
    }: z.infer<typeof createSubtasksToolInputSchema>) => {
      const created = createSubtasksForTask(
        taskId,
        subtasks.map((item) => item.title),
      );

      return {
        taskId,
        createdCount: created.length,
        subtasks: created,
      };
    },
  });
}

export function createBriefingTools() {
  return {
    prioritize: createPrioritizeTool(),
    detectStale: createDetectStaleTool(),
    draftStatusUpdate: createDraftStatusUpdateTool(),
  };
}

export function createAllAgentTools() {
  return {
    ...createBriefingTools(),
    createSubtasks: createCreateSubtasksTool(),
  };
}
