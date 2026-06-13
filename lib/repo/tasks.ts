import { randomUUID } from "node:crypto";
import { formatISO } from "date-fns";

import { getDb } from "@/lib/db";
import * as jsonStore from "@/lib/repo/json-store";
import {
  createTaskSchema,
  taskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type Task,
  type TaskStatus,
  type UpdateTaskInput,
} from "@/lib/schema";

export interface ListTasksOptions {
  status?: TaskStatus;
  sort?: "priority" | "createdAt";
}

interface TaskRow {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: string;
  created_at: string;
}

function useJsonStore(): boolean {
  return process.env.STORAGE_BACKEND === "json";
}

function rowToTask(row: TaskRow): Task {
  return taskSchema.parse({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
  });
}

function listTasksSqlite(options: ListTasksOptions = {}): Task[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (options.status) {
    conditions.push("status = @status");
    params.status = options.status;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const orderClause =
    options.sort === "priority"
      ? `ORDER BY CASE priority
          WHEN 'high' THEN 0
          WHEN 'medium' THEN 1
          WHEN 'low' THEN 2
        END`
      : "ORDER BY created_at DESC";

  const stmt = db.prepare(
    `SELECT id, title, description, status, priority, created_at
     FROM tasks
     ${whereClause}
     ${orderClause}`,
  );

  const rows = stmt.all(params) as TaskRow[];
  return rows.map(rowToTask);
}

function getTaskSqlite(id: string): Task | null {
  const db = getDb();
  const stmt = db.prepare(
    `SELECT id, title, description, status, priority, created_at
     FROM tasks
     WHERE id = @id`,
  );

  const row = stmt.get({ id }) as TaskRow | undefined;
  return row ? rowToTask(row) : null;
}

function createTaskSqlite(input: CreateTaskInput): Task {
  const data = createTaskSchema.parse(input);
  const db = getDb();

  const task = taskSchema.parse({
    id: randomUUID(),
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    createdAt: formatISO(new Date()),
  });

  const stmt = db.prepare(
    `INSERT INTO tasks (id, title, description, status, priority, created_at)
     VALUES (@id, @title, @description, @status, @priority, @createdAt)`,
  );

  stmt.run({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    createdAt: task.createdAt,
  });

  return task;
}

function updateTaskSqlite(id: string, input: UpdateTaskInput): Task | null {
  const data = updateTaskSchema.parse(input);
  const existing = getTaskSqlite(id);

  if (!existing) {
    return null;
  }

  const updated = taskSchema.parse({
    ...existing,
    ...data,
  });

  const db = getDb();
  const stmt = db.prepare(
    `UPDATE tasks
     SET title = @title,
         description = @description,
         status = @status,
         priority = @priority
     WHERE id = @id`,
  );

  const result = stmt.run({
    id,
    title: updated.title,
    description: updated.description,
    status: updated.status,
    priority: updated.priority,
  });

  return result.changes > 0 ? updated : null;
}

function deleteTaskSqlite(id: string): boolean {
  const db = getDb();
  const stmt = db.prepare("DELETE FROM tasks WHERE id = @id");
  const result = stmt.run({ id });
  return result.changes > 0;
}

export function listTasks(options: ListTasksOptions = {}): Task[] {
  return useJsonStore()
    ? jsonStore.listTasks(options)
    : listTasksSqlite(options);
}

export function getTask(id: string): Task | null {
  return useJsonStore() ? jsonStore.getTask(id) : getTaskSqlite(id);
}

export function createTask(input: CreateTaskInput): Task {
  return useJsonStore() ? jsonStore.createTask(input) : createTaskSqlite(input);
}

export function updateTask(id: string, input: UpdateTaskInput): Task | null {
  return useJsonStore()
    ? jsonStore.updateTask(id, input)
    : updateTaskSqlite(id, input);
}

export function deleteTask(id: string): boolean {
  return useJsonStore() ? jsonStore.deleteTask(id) : deleteTaskSqlite(id);
}
