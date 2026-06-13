# Agent Log

## 2025-06-13 — Фаза 0 · Cursor

**Задача:** Підготовка проєкту, стрес-тест БД, фіксація API.

**Зроблено:**

- Ініціалізовано Next.js додаток
- `test-db.js` для better-sqlite3 — нативний білд OK, SQLite залишаємо
- find-docs → актуальні API (Vercel AI SDK, Next.js, better-sqlite3) → `NOTES.md`
- створив rule для того, щоб Cursor Agent завжди опирався на `NOTES.md`

**Артефакти:** `NOTES.md` (single source of truth для наступних сесій)

## 2025-06-13 — Фаза 1 · Залежності

**Задача:** Встановити runtime-залежності для трекера + AI-шару.

**Зроблено:**

- `npm install` — `zod`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `date-fns`, `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`
- `better-sqlite3` + `@types/better-sqlite3` — вже були з Фази 0
- Додаткових `@types/*` не потрібно — усі пакети шерять власні типи

## 2025-06-13 — Фаза 1 · Схеми

**Задача:** `lib/schema.ts` — zod-схеми як single source of truth для типів.

**Зроблено:**

- `taskStatusSchema`, `taskPrioritySchema`, `taskSchema`, `subtaskSchema`
- `createTaskSchema`, `updateTaskSchema` (PATCH вимагає ≥1 поля)
- Експорт типів через `z.infer`: `Task`, `Subtask`, `CreateTaskInput`, `UpdateTaskInput`

## 2025-06-13 — Фаза 1 · Сховище

**Задача:** SQLite + JSON fallback, CRUD для tasks.

**Зроблено:**

- `lib/db.ts` — singleton `getDb()`, WAL, FK, міграції `tasks` + `subtasks`
- `lib/repo/tasks.ts` — `listTasks`, `getTask`, `createTask`, `updateTask`, `deleteTask` (фільтр `status`, сорт `priority|createdAt`)
- `lib/repo/json-store.ts` — той самий API; активується через `STORAGE_BACKEND=json`
- `devlog.json` додано в `.gitignore`
