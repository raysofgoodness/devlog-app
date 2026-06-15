import { jsonError, serverError } from '@/lib/api/http';
import { invalidParamResponse, parseUuidParam } from '@/lib/route-params';
import { toggleSubtaskStatus, deleteSubtask } from '@/lib/repo/subtasks';

export const runtime = 'nodejs';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const subtaskId = parseUuidParam(id);

    if (!subtaskId) {
      return invalidParamResponse('subtask id');
    }

    const subtask = toggleSubtaskStatus(subtaskId);

    if (!subtask) {
      return jsonError('Subtask not found', 404);
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
    const subtaskId = parseUuidParam(id);

    if (!subtaskId) {
      return invalidParamResponse('subtask id');
    }

    const deleted = deleteSubtask(subtaskId);

    if (!deleted) {
      return jsonError('Subtask not found', 404);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return serverError(error);
  }
}
