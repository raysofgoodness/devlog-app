import { z } from 'zod';

import { toggleSubtaskStatus, deleteSubtask } from '@/lib/repo/subtasks';

export const runtime = 'nodejs';

const subtaskIdSchema = z.uuid();

function serverError(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return Response.json({ error: message }, { status: 500 });
}

function parseSubtaskId(id: string): string | Response {
  const result = subtaskIdSchema.safeParse(id);

  if (!result.success) {
    return Response.json({ error: 'Invalid subtask id' }, { status: 400 });
  }

  return result.data;
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const subtaskId = parseSubtaskId(id);

    if (subtaskId instanceof Response) {
      return subtaskId;
    }

    const subtask = toggleSubtaskStatus(subtaskId);

    if (!subtask) {
      return Response.json({ error: 'Subtask not found' }, { status: 404 });
    }

    return Response.json(subtask);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const subtaskId = parseSubtaskId(id);

    if (subtaskId instanceof Response) {
      return subtaskId;
    }

    const deleted = deleteSubtask(subtaskId);

    if (!deleted) {
      return Response.json({ error: 'Subtask not found' }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return serverError(error);
  }
}
