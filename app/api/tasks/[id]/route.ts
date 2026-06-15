import { z, ZodError } from 'zod';

import { deleteTask, getTask, updateTask } from '@/lib/repo/tasks';
import { attachSubtasksToTask } from '@/lib/repo/task-with-subtasks';
import { updateTaskSchema } from '@/lib/schema';

export const runtime = 'nodejs';

const taskIdSchema = z.uuid();

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

function parseTaskId(id: string): string | Response {
  const result = taskIdSchema.safeParse(id);

  if (!result.success) {
    return Response.json({ error: 'Invalid task id' }, { status: 400 });
  }

  return result.data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const taskId = parseTaskId(id);

    if (taskId instanceof Response) {
      return taskId;
    }

    const task = getTask(taskId);

    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
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
    const taskId = parseTaskId(id);

    if (taskId instanceof Response) {
      return taskId;
    }

    const body: unknown = await request.json();
    const input = updateTaskSchema.parse(body);
    const task = updateTask(taskId, input);

    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    return Response.json(attachSubtasksToTask(task));
  } catch (error) {
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
    const taskId = parseTaskId(id);

    if (taskId instanceof Response) {
      return taskId;
    }

    const deleted = deleteTask(taskId);

    if (!deleted) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return serverError(error);
  }
}
