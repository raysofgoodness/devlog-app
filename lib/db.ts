import Database from 'better-sqlite3';
import path from 'node:path';

const globalForDb = globalThis as unknown as { db: Database.Database | undefined };

const DB_PATH = path.join(process.cwd(), 'devlog.db');

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'done')),
      priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks (task_id);
  `);
}

export function getDb(): Database.Database {
  if (!globalForDb.db) {
    globalForDb.db = new Database(DB_PATH, { timeout: 5000 });
    globalForDb.db.pragma('journal_mode = WAL');
    globalForDb.db.pragma('foreign_keys = ON');
    migrate(globalForDb.db);
  }

  return globalForDb.db;
}
