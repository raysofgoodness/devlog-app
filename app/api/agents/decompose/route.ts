import { ZodError, z } from 'zod';

import {
  jsonError,
  parseJsonBody,
  serverError,
  validationError,
} from '@/lib/api/http';
import { decomposeTask } from '@/lib/ai/decompose';

export const runtime = 'nodejs';

const decomposeRequestSchema = z
  .object({
    taskId: z.uuid(),
    confirm: z.boolean().optional().default(false),
    subtasks: z
      .array(z.string().trim().min(1).max(200))
      .min(1)
      .max(20)
      .optional(),
    answers: z.array(z.string().trim().min(1).max(2000)).max(10).optional(),
  })
  .refine((data) => !data.confirm || Boolean(data.subtasks?.length), {
    message: 'subtasks are required when confirm is true',
    path: ['subtasks'],
  });

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseJsonBody(request);
    const input = decomposeRequestSchema.parse(body);
    const result = await decomposeTask({
      taskId: input.taskId,
      confirm: input.confirm,
      subtasks: input.subtasks,
      answers: input.answers,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError('Invalid JSON body', 400);
    }

    if (error instanceof ZodError) {
      return validationError(error);
    }

    if (error instanceof Error && error.message === 'Task not found') {
      return jsonError(error.message, 404);
    }

    return serverError(error);
  }
}
