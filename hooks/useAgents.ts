'use client';

import { useMutation } from '@tanstack/react-query';

import {
  requestBriefing,
  requestDecompose,
  requestPrioritize,
  type BriefingResponse,
  type DecomposeResponse,
  type PrioritizeResponse,
} from '@/lib/agent-api-client';

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
  return useMutation({
    mutationFn: (input: {
      taskId: string;
      confirm?: boolean;
      subtasks?: string[];
      answers?: string[];
    }) => requestDecompose(input),
  });
}

export type {
  BriefingResponse,
  DecomposeResponse,
  PrioritizeResponse,
};
