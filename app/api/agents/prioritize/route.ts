import { ZodError, z } from 'zod';

import {
  jsonError,
  parseJsonBody,
  serverError,
  validationError,
} from '@/lib/api/http';
import { prioritizeTasks } from '@/lib/ai/prioritize';

export const runtime = 'nodejs';

const prioritizeRequestSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseJsonBody(request);
    const input = prioritizeRequestSchema.parse(body);
    const result = await prioritizeTasks({ limit: input.limit });

    return Response.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError('Invalid JSON body', 400);
    }

    if (error instanceof ZodError) {
      return validationError(error);
    }

    return serverError(error);
  }
}
