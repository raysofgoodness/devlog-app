import { tool } from 'ai';
import { z } from 'zod';

import { createSubtasksForTask } from '@/lib/repo/subtasks';

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
