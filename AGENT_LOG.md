# Agent Log

## 2025-06-13 — Фаза 0 · Cursor

**Задача:** Підготовка проєкту, стрес-тест БД, фіксація API.

**Зроблено:**

- Ініціалізовано Next.js 15 додаток
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
