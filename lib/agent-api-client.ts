import { ApiError } from '@/lib/api-client';
import type { Subtask } from '@/lib/schema';

export interface AgentMeta {
  generatedAt: string;
  provider: 'openai' | 'anthropic' | 'mock';
  isMock: boolean;
}

export interface PrioritizeResponse extends AgentMeta {
  plan: string;
  scoredTasks: Array<{
    taskId: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    score: number;
    rank: number;
  }>;
}

export interface BriefingResponse extends AgentMeta {
  briefing: string;
  toolData: {
    prioritize?: unknown;
    detectStale?: unknown;
    draftStatusUpdate?: unknown;
  };
  stepCount: number;
}

export type DecomposeResponse =
  | ({
      kind: 'questions';
      taskId: string;
      taskTitle: string;
      questions: string[];
    } & AgentMeta)
  | ({
      kind: 'proposal';
      taskId: string;
      taskTitle: string;
      proposedSubtasks: string[];
    } & AgentMeta)
  | ({
      kind: 'created';
      taskId: string;
      taskTitle: string;
      subtasks: Subtask[];
    } & AgentMeta);

async function parseAgentResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    throw new ApiError(body?.error ?? response.statusText, response.status);
  }

  return response.json() as Promise<T>;
}

export async function requestPrioritize(
  body: { limit?: number } = {},
): Promise<PrioritizeResponse> {
  const response = await fetch('/api/agents/prioritize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return parseAgentResponse<PrioritizeResponse>(response);
}

export async function requestBriefing(
  body: {
    limit?: number;
    staleDays?: number;
    tone?: 'professional' | 'casual' | 'concise';
  } = {},
): Promise<BriefingResponse> {
  const response = await fetch('/api/agents/briefing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return parseAgentResponse<BriefingResponse>(response);
}

export async function requestDecompose(body: {
  taskId: string;
  confirm?: boolean;
  subtasks?: string[];
  answers?: string[];
}): Promise<DecomposeResponse> {
  const response = await fetch('/api/agents/decompose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return parseAgentResponse<DecomposeResponse>(response);
}
