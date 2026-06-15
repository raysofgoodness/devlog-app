import { ZodError, z } from 'zod';

import { decomposeTask } from '@/lib/ai/decompose';

export const runtime = 'nodejs';

const decomposeRequestSchema = z
  .object({
    taskId: z.uuid(),
    confirm: z.boolean().optional().default(false),
    subtasks: z.array(z.string().trim().min(1).max(200)).min(1).max(20).optional(),
    answers: z.array(z.string().trim().min(1).max(2000)).max(10).optional(),
  })
  .refine((data) => !data.confirm || Boolean(data.subtasks?.length), {
    message: 'subtasks are required when confirm is true',
    path: ['subtasks'],
  });

function validationError(error: ZodError): Response {
  return Response.json(
    { error: 'Validation failed', issues: error.issues },
    { status: 400 },
  );
}

function serverError(error: unknown): Response {
  if (error instanceof Error && error.message === 'Task not found') {
    return Response.json({ error: error.message }, { status: 404 });
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  return Response.json({ error: message }, { status: 500 });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const input = decomposeRequestSchema.parse(body);
    const result = await decomposeTask({
      taskId: input.taskId,
      confirm: input.confirm,
      subtasks: input.subtasks,
      answers: input.answers,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return serverError(error);
  }
}
