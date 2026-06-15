import { ZodError } from 'zod';

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export function validationError(error: ZodError): Response {
  return Response.json(
    { error: 'Validation failed', issues: error.issues },
    { status: 400 },
  );
}

export function serverError(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return jsonError(message, 500);
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  const rawBody = await request.text();

  if (rawBody.length === 0) {
    return {};
  }

  return JSON.parse(rawBody) as unknown;
}
