import { randomUUID } from 'node:crypto';
import { formatISO } from 'date-fns';

import { getDb } from '@/lib/db';
import { getTask } from '@/lib/repo/tasks';
import * as jsonStore from '@/lib/repo/json-store';
import { useJsonStore } from '@/lib/repo/storage-backend';
import {
  subtaskSchema,
  type Subtask,
  type SubtaskStatus,
} from '@/lib/schema';

interface SubtaskRow {
  id: string;
  task_id: string;
  title: string;
  status: SubtaskStatus;
  created_at: string;
}

function rowToSubtask(row: SubtaskRow): Subtask {
  return subtaskSchema.parse({
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
  });
}

function toggleSubtaskStatusSqlite(id: string): Subtask | null {
  const db = getDb();
  const getStmt = db.prepare(
    `SELECT id, task_id, title, status, created_at
     FROM subtasks
     WHERE id = @id`,
  );

  const row = getStmt.get({ id }) as SubtaskRow | undefined;

  if (!row) {
    return null;
  }

  const nextStatus: SubtaskStatus = row.status === 'todo' ? 'done' : 'todo';

  const updateStmt = db.prepare(
    `UPDATE subtasks
     SET status = @status
     WHERE id = @id`,
  );

  const result = updateStmt.run({ id, status: nextStatus });

  if (result.changes === 0) {
    return null;
  }

  return rowToSubtask({ ...row, status: nextStatus });
}

export function toggleSubtaskStatus(id: string): Subtask | null {
  return useJsonStore()
    ? jsonStore.toggleSubtaskStatus(id)
    : toggleSubtaskStatusSqlite(id);
}

function createSubtasksForTaskSqlite(taskId: string, titles: string[]): Subtask[] {
  const parent = getTask(taskId);

  if (!parent) {
    throw new Error('Task not found');
  }

  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO subtasks (id, task_id, title, status, created_at)
     VALUES (@id, @taskId, @title, @status, @createdAt)`,
  );

  const createMany = db.transaction((items: string[]) => {
    const created: Subtask[] = [];

    for (const title of items) {
      const subtask = subtaskSchema.parse({
        id: randomUUID(),
        taskId,
        title,
        status: 'todo',
        createdAt: formatISO(new Date()),
      });

      insert.run({
        id: subtask.id,
        taskId: subtask.taskId,
        title: subtask.title,
        status: subtask.status,
        createdAt: subtask.createdAt,
      });

      created.push(subtask);
    }

    return created;
  });

  return createMany(titles);
}

export function createSubtasksForTask(taskId: string, titles: string[]): Subtask[] {
  if (titles.length === 0) {
    throw new Error('At least one subtask title is required');
  }

  return useJsonStore()
    ? jsonStore.createSubtasksForTask(taskId, titles)
    : createSubtasksForTaskSqlite(taskId, titles);
}

function listSubtasksForTaskIdsSqlite(taskIds: string[]): Subtask[] {
  if (taskIds.length === 0) {
    return [];
  }

  const db = getDb();
  const placeholders = taskIds.map((_, index) => `@id${index}`).join(', ');
  const params = Object.fromEntries(
    taskIds.map((id, index) => [`id${index}`, id]),
  );

  const stmt = db.prepare(
    `SELECT id, task_id, title, status, created_at
     FROM subtasks
     WHERE task_id IN (${placeholders})
     ORDER BY created_at ASC`,
  );

  const rows = stmt.all(params) as SubtaskRow[];
  return rows.map(rowToSubtask);
}

function deleteSubtaskSqlite(id: string): boolean {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM subtasks WHERE id = @id');
  const result = stmt.run({ id });
  return result.changes > 0;
}

export function listSubtasksForTaskIds(taskIds: string[]): Subtask[] {
  return useJsonStore()
    ? jsonStore.listSubtasksForTaskIds(taskIds)
    : listSubtasksForTaskIdsSqlite(taskIds);
}

export function deleteSubtask(id: string): boolean {
  return useJsonStore()
    ? jsonStore.deleteSubtask(id)
    : deleteSubtaskSqlite(id);
}
