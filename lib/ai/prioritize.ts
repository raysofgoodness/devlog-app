import { formatISO } from "date-fns";

import { getLlmProviderConfig, getLanguageModel } from "@/lib/ai/provider";
import { scoreTask } from "@/lib/ai/scoring";
import { listTasks } from "@/lib/repo/tasks";
import type { Task } from "@/lib/schema";

export interface ScoredTaskEntry {
  task: Task;
  score: number;
  rank: number;
}

export interface PrioritizeResult {
  plan: string;
  scoredTasks: Array<{
    taskId: string;
    title: string;
    status: Task["status"];
    priority: Task["priority"];
    createdAt: string;
    score: number;
    rank: number;
  }>;
  generatedAt: string;
  provider: ReturnType<typeof getLlmProviderConfig>["provider"];
  isMock: boolean;
}

const PRIORITIZE_SYSTEM = `You are a productivity coach for DevLog, a developer task tracker.

You receive tasks pre-scored by a deterministic formula:
- priority weight: low=10, medium=25, high=50
- age bonus: +2 per calendar day since createdAt (max +30)
- status adjustment: todo=0, in-progress=+15 (done tasks are already excluded)

Your job:
1. Propose an ordered plan for TODAY — not a blind copy of score rank.
2. Explain reasoning for each item; reference priority, age, and status.
3. Use markdown: a short intro, numbered list with bold titles, and a "Why this order" section.
4. Keep it actionable and concise.
5. You may swap adjacent items only if you state a clear dependency reason.`;

function toScoredTaskPayload(entry: ScoredTaskEntry) {
  return {
    taskId: entry.task.id,
    title: entry.task.title,
    status: entry.task.status,
    priority: entry.task.priority,
    createdAt: entry.task.createdAt,
    score: entry.score,
    rank: entry.rank,
  };
}

export function scoreAndRankTasks(
  tasks: Task[],
  options?: { now?: string },
): ScoredTaskEntry[] {
  return tasks
    .filter((task) => task.status !== "done")
    .map((task) => ({ task, score: scoreTask(task, options) }))
    .toSorted((left, right) => right.score - left.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function buildPrioritizePrompt(scoredTasks: ScoredTaskEntry[]): string {
  const briefs = scoredTasks.map(({ task, score, rank }) => ({
    rank,
    score,
    id: task.id,
    title: task.title,
    description: task.description.slice(0, 400),
    status: task.status,
    priority: task.priority,
    createdAt: task.createdAt,
  }));

  return `Create a daily prioritization plan for these scored tasks.

Scored tasks (higher score = higher default urgency):
${JSON.stringify(briefs, null, 2)}`;
}

export async function prioritizeTasks(options?: {
  limit?: number;
  now?: string;
}): Promise<PrioritizeResult> {
  const providerConfig = getLlmProviderConfig();
  const generatedAt = options?.now ?? formatISO(new Date());

  const allScored = scoreAndRankTasks(listTasks(), { now: generatedAt });
  const scoredTasks = options?.limit
    ? allScored.slice(0, options.limit)
    : allScored;

  if (scoredTasks.length === 0) {
    return {
      plan: "No active tasks in the backlog. Add tasks or reopen items to get a daily plan.",
      scoredTasks: [],
      generatedAt,
      provider: providerConfig.provider,
      isMock: providerConfig.isMock,
    };
  }

  const { generateText } = await import("ai");

  const { text } = await generateText({
    model: getLanguageModel(),
    system: PRIORITIZE_SYSTEM,
    prompt: buildPrioritizePrompt(scoredTasks),
  });

  return {
    plan: text,
    scoredTasks: scoredTasks.map(toScoredTaskPayload),
    generatedAt,
    provider: providerConfig.provider,
    isMock: providerConfig.isMock,
  };
}
