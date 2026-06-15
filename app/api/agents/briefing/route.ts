import { ZodError } from 'zod';

import {
  briefingRequestSchema,
  generateDailyBriefing,
} from '@/lib/ai/briefing';

export const runtime = 'nodejs';

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
    const input = briefingRequestSchema.parse(body);
    const result = await generateDailyBriefing(input);

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
