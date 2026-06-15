import type { TaskPriority, TaskStatus } from '@/lib/schema';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
] as const;

export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'priority', label: 'Priority' },
] as const;

export type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]['value'];
export type SortOption = (typeof SORT_OPTIONS)[number]['value'];
