import { ZodError } from 'zod';

import {
  jsonError,
  parseJsonBody,
  serverError,
  validationError,
} from '@/lib/api/http';
import {
  briefingRequestSchema,
  generateDailyBriefing,
} from '@/lib/ai/briefing';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseJsonBody(request);
    const input = briefingRequestSchema.parse(body);
    const result = await generateDailyBriefing(input);

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
