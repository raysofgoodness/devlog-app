import type {
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from '@/lib/schema';

export interface ListTasksParams {
  status?: TaskStatus;
  sort?: 'priority' | 'createdAt';
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const TASKS_BASE = '/api/tasks';

async function parseResponse<T>(response: Response): Promise<T> {
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

export async function fetchTasks(params?: ListTasksParams): Promise<Task[]> {
  const response = await fetch(buildTasksUrl(params));
  return parseResponse<Task[]>(response);
}

export async function fetchTask(id: string): Promise<Task> {
  const response = await fetch(`${TASKS_BASE}/${id}`);
  return parseResponse<Task>(response);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await fetch(TASKS_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return parseResponse<Task>(response);
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

  return parseResponse<Task>(response);
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${TASKS_BASE}/${id}`, {
    method: 'DELETE',
  });

  await parseResponse<void>(response);
}
