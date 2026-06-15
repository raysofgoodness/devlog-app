import { ZodError, z } from 'zod';

import { prioritizeTasks } from '@/lib/ai/prioritize';

export const runtime = 'nodejs';

const prioritizeRequestSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
});

function validationError(error: ZodError): Response {
  return Response.json(
    { error: 'Validation failed', issues: error.issues },
    { status: 400 },
  );
}

function serverError(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return Response.json({ error: message }, { status: 500 });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.text();
    const body: unknown = rawBody.length > 0 ? JSON.parse(rawBody) : {};
    const input = prioritizeRequestSchema.parse(body);
    const result = await prioritizeTasks({ limit: input.limit });

    return Response.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (error instanceof ZodError) {
      return validationError(error);
    }

    return serverError(error);
  }
}
