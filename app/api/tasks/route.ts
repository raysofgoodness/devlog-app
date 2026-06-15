import { ZodError } from 'zod';

import {
  jsonError,
  parseJsonBody,
  serverError,
  validationError,
} from '@/lib/api/http';
import {
  createTask,
  listTasks,
  type ListTasksOptions,
} from '@/lib/repo/tasks';
import { attachSubtasksToTasks } from '@/lib/repo/task-with-subtasks';
import { createTaskSchema, taskStatusSchema } from '@/lib/schema';

export const runtime = 'nodejs';

const SORT_VALUES = ['priority', 'createdAt'] as const;

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
        return jsonError('Invalid sort. Use priority or createdAt.', 400);
      }
      options.sort = sortParam as ListTasksOptions['sort'];
    }

    const tasks = attachSubtasksToTasks(listTasks(options));
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
    const body = await parseJsonBody(request);
    const input = createTaskSchema.parse(body);
    const task = createTask(input);

    return Response.json(task, { status: 201 });
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
