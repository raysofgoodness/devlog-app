import { ZodError } from 'zod';

import {
  jsonError,
  parseJsonBody,
  serverError,
  validationError,
} from '@/lib/api/http';
import { invalidParamResponse, parseUuidParam } from '@/lib/route-params';
import { deleteTask, getTask, updateTask } from '@/lib/repo/tasks';
import { attachSubtasksToTask } from '@/lib/repo/task-with-subtasks';
import { updateTaskSchema } from '@/lib/schema';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const taskId = parseUuidParam(id);

    if (!taskId) {
      return invalidParamResponse('task id');
    }

    const task = getTask(taskId);

    if (!task) {
      return jsonError('Task not found', 404);
    }

    return Response.json(attachSubtasksToTask(task));
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const taskId = parseUuidParam(id);

    if (!taskId) {
      return invalidParamResponse('task id');
    }

    const body = await parseJsonBody(request);
    const input = updateTaskSchema.parse(body);
    const task = updateTask(taskId, input);

    if (!task) {
      return jsonError('Task not found', 404);
    }

    return Response.json(attachSubtasksToTask(task));
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const taskId = parseUuidParam(id);

    if (!taskId) {
      return invalidParamResponse('task id');
    }

    const deleted = deleteTask(taskId);

    if (!deleted) {
      return jsonError('Task not found', 404);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return serverError(error);
  }
}
