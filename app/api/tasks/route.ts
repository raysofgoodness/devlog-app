import { ZodError } from 'zod';

import {
  createTask,
  listTasks,
  type ListTasksOptions,
} from '@/lib/repo/tasks';
import { createTaskSchema, taskStatusSchema } from '@/lib/schema';

export const runtime = 'nodejs';

const SORT_VALUES = ['priority', 'createdAt'] as const;

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

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const options: ListTasksOptions = {};

    const statusParam = searchParams.get('status');
    if (statusParam) {
      options.status = taskStatusSchema.parse(statusParam);
    }

    const sortParam = searchParams.get('sort');
    if (sortParam) {
      if (!SORT_VALUES.includes(sortParam as (typeof SORT_VALUES)[number])) {
        return Response.json(
          { error: 'Invalid sort. Use priority or createdAt.' },
          { status: 400 },
        );
      }
      options.sort = sortParam as ListTasksOptions['sort'];
    }

    const tasks = listTasks(options);
    return Response.json(tasks);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return serverError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const input = createTaskSchema.parse(body);
    const task = createTask(input);

    return Response.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }

    return serverError(error);
  }
}
