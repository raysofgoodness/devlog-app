import type {
  CreateTaskInput,
  ListTasksOptions,
  Subtask,
  Task,
  TaskWithSubtasks,
  UpdateTaskInput,
} from '@/lib/schema';

export type ListTasksParams = ListTasksOptions;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const TASKS_BASE = '/api/tasks';
const SUBTASKS_BASE = '/api/subtasks';

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    throw new ApiError(
      body?.error ?? response.statusText,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function buildTasksUrl(params?: ListTasksParams): string {
  if (!params?.status && !params?.sort) {
    return TASKS_BASE;
  }

  const searchParams = new URLSearchParams();

  if (params.status) {
    searchParams.set('status', params.status);
  }

  if (params.sort) {
    searchParams.set('sort', params.sort);
  }

  return `${TASKS_BASE}?${searchParams.toString()}`;
}

export async function fetchTasks(
  params?: ListTasksParams,
): Promise<TaskWithSubtasks[]> {
  const response = await fetch(buildTasksUrl(params));
  return parseJsonResponse<TaskWithSubtasks[]>(response);
}

export async function fetchTask(id: string): Promise<TaskWithSubtasks> {
  const response = await fetch(`${TASKS_BASE}/${id}`);
  return parseJsonResponse<TaskWithSubtasks>(response);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await fetch(TASKS_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonResponse<Task>(response);
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const response = await fetch(`${TASKS_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseJsonResponse<Task>(response);
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${TASKS_BASE}/${id}`, {
    method: 'DELETE',
  });

  await parseJsonResponse<void>(response);
}

export async function toggleSubtask(id: string): Promise<Subtask> {
  const response = await fetch(`${SUBTASKS_BASE}/${id}`, {
    method: 'PATCH',
  });

  return parseJsonResponse<Subtask>(response);
}

export async function deleteSubtask(id: string): Promise<void> {
  const response = await fetch(`${SUBTASKS_BASE}/${id}`, {
    method: 'DELETE',
  });

  await parseJsonResponse<void>(response);
}
