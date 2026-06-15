import { parseJsonResponse } from '@/lib/api-client';
import type {
  BriefingResponse,
  DecomposeResponse,
  PrioritizeResponse,
} from '@/lib/types/agent';

export type {
  AgentMeta,
  BriefingResponse,
  DecomposeResponse,
  PrioritizeResponse,
} from '@/lib/types/agent';

export async function requestPrioritize(
  body: { limit?: number } = {},
): Promise<PrioritizeResponse> {
  const response = await fetch('/api/agents/prioritize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return parseJsonResponse<PrioritizeResponse>(response);
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

  return parseJsonResponse<BriefingResponse>(response);
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

  return parseJsonResponse<DecomposeResponse>(response);
}
