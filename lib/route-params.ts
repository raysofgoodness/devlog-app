import { z } from 'zod';

import { jsonError } from '@/lib/api/http';

const uuidSchema = z.uuid();

export function parseUuidParam(id: string): string | null {
  const result = uuidSchema.safeParse(id);
  return result.success ? result.data : null;
}

export function invalidParamResponse(label: string): Response {
  return jsonError(`Invalid ${label}`, 400);
}
