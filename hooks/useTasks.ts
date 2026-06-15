'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createTask,
  deleteSubtask,
  deleteTask,
  fetchTasks,
  toggleSubtask,
  updateTask,
  type ListTasksParams,
} from '@/lib/api-client';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/schema';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params?: ListTasksParams) => [...taskKeys.lists(), params] as const,
};

export function useTasks(params?: ListTasksParams) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => fetchTasks(params),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      updateTask(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useToggleSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleSubtask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSubtask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
