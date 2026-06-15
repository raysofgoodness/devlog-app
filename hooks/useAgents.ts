'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  requestBriefing,
  requestDecompose,
  requestPrioritize,
  type BriefingResponse,
  type DecomposeResponse,
  type PrioritizeResponse,
} from '@/lib/agent-api-client';
import { taskKeys } from '@/hooks/useTasks';

export function usePrioritizeAgent() {
  return useMutation({
    mutationFn: (input: { limit?: number } = {}) => requestPrioritize(input),
  });
}

export function useBriefingAgent() {
  return useMutation({
    mutationFn: (
      input: {
        limit?: number;
        staleDays?: number;
        tone?: 'professional' | 'casual' | 'concise';
      } = {},
    ) => requestBriefing(input),
  });
}

export function useDecomposeAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      taskId: string;
      confirm?: boolean;
      subtasks?: string[];
      answers?: string[];
    }) => requestDecompose(input),
    onSuccess: (response) => {
      if (response.kind === 'created') {
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      }
    },
  });
}

export type { BriefingResponse, DecomposeResponse, PrioritizeResponse };
