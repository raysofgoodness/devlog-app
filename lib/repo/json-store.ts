import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { formatISO } from 'date-fns';

import {
  createTaskSchema,
  subtaskSchema,
  taskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type Subtask,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type UpdateTaskInput,
} from '@/lib/schema';

const STORE_PATH = path.join(process.cwd(), 'devlog.json');

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

interface StoreData {
  tasks: Task[];
  subtasks: Subtask[];
}

export interface ListTasksOptions {
  status?: TaskStatus;
  sort?: 'priority' | 'createdAt';
}

function readStore(): StoreData {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as StoreData;

    return {
      tasks: parsed.tasks.map((task) => taskSchema.parse(task)),
      subtasks: (parsed.subtasks ?? []).map((subtask) => {
        const raw = subtask as Subtask & { status?: Subtask['status'] };

        return subtaskSchema.parse({
          ...raw,
          status: raw.status ?? 'todo',
        });
      }),
    };
  } catch {
    return { tasks: [], subtasks: [] };
  }
}

function writeStore(data: StoreData): void {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function sortTasks(tasks: Task[], sort: ListTasksOptions['sort']): Task[] {
  const sorted = [...tasks];

  if (sort === 'priority') {
    return sorted.sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
    );
  }

  return sorted.sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt),
  );
}

export function listTasks(options: ListTasksOptions = {}): Task[] {
  const store = readStore();
  let tasks = store.tasks;

  if (options.status) {
    tasks = tasks.filter((task) => task.status === options.status);
  }

  return sortTasks(tasks, options.sort ?? 'createdAt');
}

export function getTask(id: string): Task | null {
  const store = readStore();
  return store.tasks.find((task) => task.id === id) ?? null;
}

export function createTask(input: CreateTaskInput): Task {
  const data = createTaskSchema.parse(input);
  const store = readStore();

  const task = taskSchema.parse({
    id: randomUUID(),
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    createdAt: formatISO(new Date()),
  });

  store.tasks.push(task);
  writeStore(store);

  return task;
}

export function updateTask(id: string, input: UpdateTaskInput): Task | null {
  const data = updateTaskSchema.parse(input);
  const store = readStore();
  const index = store.tasks.findIndex((task) => task.id === id);

  if (index === -1) {
    return null;
  }

  const current = store.tasks[index];
  const updated = taskSchema.parse({
    ...current,
    ...data,
  });

  store.tasks[index] = updated;
  writeStore(store);

  return updated;
}

export function deleteTask(id: string): boolean {
  const store = readStore();
  const nextLength = store.tasks.length;
  store.tasks = store.tasks.filter((task) => task.id !== id);
  store.subtasks = store.subtasks.filter((subtask) => subtask.taskId !== id);

  if (store.tasks.length === nextLength) {
    return false;
  }

  writeStore(store);
  return true;
}

export function toggleSubtaskStatus(id: string): Subtask | null {
  const store = readStore();
  const index = store.subtasks.findIndex((subtask) => subtask.id === id);

  if (index === -1) {
    return null;
  }

  const current = store.subtasks[index];
  const updated = subtaskSchema.parse({
    ...current,
    status: current.status === 'todo' ? 'done' : 'todo',
  });

  store.subtasks[index] = updated;
  writeStore(store);

  return updated;
}

export function createSubtasksForTask(taskId: string, titles: string[]): Subtask[] {
  const parent = getTask(taskId);

  if (!parent) {
    throw new Error('Task not found');
  }

  if (titles.length === 0) {
    throw new Error('At least one subtask title is required');
  }

  const store = readStore();
  const created = titles.map((title) =>
    subtaskSchema.parse({
      id: randomUUID(),
      taskId,
      title,
      status: 'todo',
      createdAt: formatISO(new Date()),
    }),
  );

  store.subtasks.push(...created);
  writeStore(store);

  return created;
}

export function listSubtasksForTaskIds(taskIds: string[]): Subtask[] {
  if (taskIds.length === 0) {
    return [];
  }

  const store = readStore();
  const taskIdSet = new Set(taskIds);

  return store.subtasks.filter((subtask) => taskIdSet.has(subtask.taskId));
}

export function deleteSubtask(id: string): boolean {
  const store = readStore();
  const nextLength = store.subtasks.length;
  store.subtasks = store.subtasks.filter((subtask) => subtask.id !== id);

  if (store.subtasks.length === nextLength) {
    return false;
  }

  writeStore(store);
  return true;
}
