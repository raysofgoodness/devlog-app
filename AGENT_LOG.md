# Agent Log

**Підготовка:** Проаналізував завдання, виконав декомпозицію цього завдання

- для розбиття на зрозумілі фази та підзадачі і складання плану, використовував `Claude Opus 4.8`
- він підготував мені агентний план, розбитий на фази від 0 до 4, де фаза 0 це була підготовка
- виділив ключові технічні рішення, також я йому давав промт щоб план включав візуальну Архітектуру агентів, щоб мені було легши її проаналізувати, і внести правки, якщо це потрібно

## Фаза 0 · Cursor

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

## 2025-06-13 — Фаза 1 · API routes

**Задача:** Route handlers для tasks CRUD.

**Зроблено:**

- `app/api/tasks/route.ts` — `GET` (`?status=`, `?sort=priority|createdAt`), `POST` (zod)
- `app/api/tasks/[id]/route.ts` — `GET`, `PATCH`, `DELETE` (204)
- `runtime = 'nodejs'` для better-sqlite3
- Fix: `z.iso.datetime({ offset: true })` — сумісність з `formatISO` від date-fns

**Було пропущено:**

- тут агент пропустив і не врахував наші підзадачі, тому прийшлось виправити цей момент і запустити додатку задачу, й внести зміни в схему та `db.ts`

## 2025-06-13 — Фаза 1 · Subtasks PATCH

**Задача:** `PATCH /api/subtasks/[id]` — toggle статусу підзадачі.

**Зроблено:**

- `subtaskStatusSchema` (`todo` | `done`) + поле `status` у `subtaskSchema`
- Міграція SQLite: колонка `status` (ALTER для існуючих БД)
- `lib/repo/subtasks.ts` — `toggleSubtaskStatus()`
- `app/api/subtasks/[id]/route.ts` — `PATCH` без body, flip `todo` ↔ `done`

## 2025-06-13 — Фаза 1 · Client data layer

**Задача:** TanStack Query + API client для tasks.

**Зроблено:**

- `lib/api-client.ts` — `fetchTasks`, `fetchTask`, `createTask`, `updateTask`, `deleteTask` + `ApiError`
- `hooks/useTasks.ts` — `useTasks`, `useCreateTask`, `useUpdateTask`, `useDeleteTask` + `taskKeys`
- `app/providers.tsx` — `QueryClientProvider`
- `app/layout.tsx` — обгортка `<Providers>`
