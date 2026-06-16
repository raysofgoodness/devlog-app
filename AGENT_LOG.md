# Agent Log

## Preparation

Before writing any code at all, I decided to spend time on proper planning — it paid off.

I used `Claude Opus 4.8` and asked it to break the task into phases. It produced a plan from phase 0 to 4, where zero is pure preparation. Besides decomposition, I deliberately asked to include a visual agent architecture in the plan — I wanted to see the big picture, not just a task list. That helped identify weak spots before they became problems and make fixes early.

---

## Phase 0 — Project preparation

**Goal:** set up the foundation, verify SQLite, lock down APIs.

I started with a stress test of the storage choice — ran the `grill-me` skill to verify `better-sqlite3` and make sure the native build compiles cleanly. All good; kept SQLite.

In parallel I ran `find-docs` — pulled current APIs for Vercel AI SDK, Next.js, and better-sqlite3, and consolidated everything into `NOTES.md`. That became the single source of truth for all following sessions. I also added a Cursor rule so the agent always reads that file — without it, the agent would guess instead of checking documentation.

I already had skills and rules wired up: `typescript-frontend`, `frontend-design`, `react-best-practices`, `vercel-next-best-practices`, `using-ui-stack`, `auto-type-checking`. The last one is especially useful — a hook on `tsc` after every edit catches errors immediately, so build/type issues surface right away.

Each subtask was done via codex/auto/claude agents, and I manually validated the result at the end. Agents execute tasks well, but validation is always on me.

---

## Phase 1 — Dependencies

This went smoothly. The agent installed everything per plan: `zod`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `date-fns`, `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `better-sqlite3` + types.

---

## Phase 1 — Schemas

Zod schemas for everything: `taskStatusSchema`, `taskPrioritySchema`, `taskSchema`, `subtaskSchema`, `createTaskSchema`, `updateTaskSchema`. PATCH requires at least one field — behavior I wanted to make explicit. Types via `z.infer`, nothing extra. I handed this task to the agent too; it did the work, I verified alignment at the end.

---

## Phase 1 — Storage

SQLite singleton via `getDb()` with WAL and foreign keys, migrations for `tasks` and `subtasks`. All CRUD in `lib/repo/tasks.ts` — `listTasks`, `getTask`, `createTask`, `updateTask`, `deleteTask` with status filter and sorting.

In parallel I built `json-store.ts` with the same interface — enabled via `STORAGE_BACKEND=json`. Useful for tests without spinning up a DB.

---

## Phase 1 — API routes

`GET` with filters, `POST` with Zod validation, `GET/PATCH/DELETE` by id. `runtime = 'nodejs'` for better-sqlite3 — without this, Edge runtime breaks.

Here the agent skipped a few subtasks from our plan. Had to stop, go back, run a separate task, and update the schema and `db.ts`. Overall fine, but I had to review its earlier steps.

---

## Phase 1 — Subtasks PATCH

Added `status` (`todo` | `done`) to subtasks, SQLite migration via `ALTER` for existing DBs, `toggleSubtaskStatus()` in the repo, and route `PATCH /api/subtasks/[id]` — no body, just flip state.

---

## Phase 1 — Client data layer

`lib/api-client.ts` — full HTTP layer with `ApiError`. `hooks/useTasks.ts` — TanStack Query mutations and cache keys. `QueryClientProvider` in `app/providers.tsx`, wrapper in `layout.tsx`. Done to standard.

---

## Phase 1 — UI

Initialized shadcn, scaffolded components: button, card, dialog, badge, toggle-group, and the rest. Structure: `AppHeader` + `TasksBoard`. Then `TaskList`, `TaskCard`, `TaskFilters`, `TaskForm`, `DeleteConfirm`, `TaskStatusBadge`, `TaskPriorityBadge`.

For the agent I used skills `/shadcn`, `/frontend-design`, `/ui-stack-design` — without them it builds something functional but not great. I did not love the first design pass, but fixes were minimal. Theme: Outfit + JetBrains Mono, teal accents, dark mode toggle.

---

## Phase 2 — AI provider + mock

OpenAI/Anthropic/Groq selection via env; no key → deterministic mock.

`lib/ai/provider.ts` — reads `LLM_PROVIDER` and `AI_MODEL`, defaults: `gpt-4.1-mini` / `claude-sonnet-4-20250514` / `mock-llm`. If there is no key, it falls back to mock; it does not auto-switch to another provider. I wanted predictable behavior.

`lib/ai/mock.ts` — `MockLanguageModelV3` compatible with AI SDK 6. Deterministic responses by keywords in the prompt: `prioritize`, `decompose`, `briefing`, `status`. Tool-calling: step 1 — call required tools, step 2 — text synthesis. JSON mode for structured output is there too.

Separately I added Gemini and Groq — not in the initial plan, but I wanted options. In practice I only ran via Groq with Llama 3. Had to tweak manually: Llama on Groq only supports `json_object` or regular tool calling, not `json_schema` mode — changed that by hand.

**Env:**
```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4.1-mini
```

Also used `find-docs` again (AI SDK 6 API check) and `saving-workspace-context` to persist context across agent chats.

---

## Phase 2 — Task scoring (TDD)

`scoreTask()` — pure function: weight by priority (low=10, medium=25, high=50) + age bonus (+2/day, cap 30 via date-fns) + status (todo=0, in-progress=+15, done=-1000).

Wrote tests first, then implementation — 5 behavioral tests through the public API. For determinism I pass `now` explicitly in tests.
For explicit verification and testing, I gave the agent the extra `/tdd` skill so it wrote tests first and functions on top of them — that helped us avoid extra bugs later.

`npm test` — 5/5 pass, `tsc` — clean.

---

## Phase 2 — Agent A (prioritize)

`scoreAndRankTasks()` filters done tasks and sorts by score. `prioritizeTasks()` loads tasks from the DB, ranks them, and calls `generateText` with a system prompt that explains the formula and asks for a markdown plan. If the backlog is empty — LLM is not called.

Route: `POST /api/agents/prioritize`, body `{ limit?: 1..50 }`, response: `{ plan, scoredTasks[], generatedAt, provider, isMock }`.

Test that done tasks are excluded and ranking is correct. `npm test` — 6/6.

---

## Phase 2 — Agent B (decompose)

Two modes: analyze (`confirm: false`) and persist (`confirm: true`).

On analyze — `generateText` + `Output.object` → either `kind: questions` (task unclear) or `kind: proposal` (concrete subtask plan). If questions — user can answer and run again. On confirm — tool `createSubtasks` writes to the DB, fallback to repo if the tool fails.

Route: `POST /api/agents/decompose`, three body variants — initial analyze, retry with answers, save after approval.

---

## Phase 2 — AI tools

Four tools with Zod parameters:

- `prioritize` — `limit?` → ranked list with scores
- `detectStale` — `staleDays?` (default 3) → in-progress tasks where days >= threshold
- `draftStatusUpdate` — `taskId?`, `tone?` → Slack-style draft
- `createSubtasks` — `taskId`, `subtasks[]` → writes to DB

Factories for each + aggregators `createBriefingTools()` (3 tools for briefing) and `createAllAgentTools()` (all 4).

Building the agents was delegated to the agent, per our plan.

---

## Phase 2 — Agent D (briefing)

Multi-step tool-calling: `generateText` + all three briefing tools + `stepCountIs(8)`. System prompt forces calling `prioritize`, `detectStale`, and `draftStatusUpdate` before writing the final markdown.

Route: `POST /api/agents/briefing`, optional body `{ limit, staleDays, tone }`.

---

## Phase 2 — Agent UI

`lib/agent-api-client.ts` — three functions with typed responses. `hooks/useAgents.ts` — TanStack mutations.

Components:
- `agents-panel.tsx` — three buttons: “Daily plan”, “Split task”, “Morning briefing”
- `prioritize-dialog.tsx` — markdown plan + scored list
- `briefing-dialog.tsx` — markdown briefing + step count
- `decompose-dialog.tsx` — pick task → questions or proposal → “Create subtasks”

Integrated into `TasksBoard`, **Split** button on `TaskCard` opens decompose with preselected task.

Two bugs after the agent that I fixed manually: first, clicking Split showed the task UUID instead of its title — small but immediately obvious. Second, subtasks rendered poorly, without progress. Both fixed quickly.

**Decompose UX flow:**
1. Analyze → `questions` or `proposal`
2. If questions — textarea for answers (one per line) → re-analyze
3. If proposal — “Create subtasks” → `kind: created` + toast

---

## Phase 2 — Unit tests

Added tests only where it actually makes sense — pure functions:

- `scoring.test.ts` — +1 test for cap age bonus (30 days)
- `tools.test.ts` — `detectStaleTasks`: threshold, sort, status filter, empty
- `decompose.test.ts` — `normalizeClarityOutput` + `parseAnswerLines`
- `parse-answers.ts` — extracted `parseAnswerLines` from UI into its own module

Deliberately did not test everything — routes, UI components, agent logic with mocks cost more time than they give. 18 tests, 4 files, all green.

---

## Polish

Separately ran an agent with the `/frontend-design` skill — the initial task grid was not quite right in some small visual details; I adjusted.

At the very end I deliberately ran `/reviewing-code` to double-check everything and confirm there are no antipatterns or bugs.

Ran the `/auditing-security` skill. Conclusion: adding Auth, Rate Limiting, or Security Headers right now would be over-engineering for what is essentially a local project. Code would get more complex with no real need. Left as is.
