import { z } from 'zod';

const uuidSchema = z.uuid();

export function parseUuidParam(id: string): string | null {
  const result = uuidSchema.safeParse(id);
  return result.success ? result.data : null;
}

export function invalidParamResponse(label: string): Response {
  return Response.json({ error: `Invalid ${label}` }, { status: 400 });
}
