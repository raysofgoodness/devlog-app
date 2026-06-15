import { differenceInCalendarDays, parseISO } from 'date-fns';

import type { Task, TaskPriority, TaskStatus } from '@/lib/schema';

export type ScoreableTask = Pick<Task, 'priority' | 'status' | 'createdAt'>;

export interface ScoreTaskOptions {
  /** ISO datetime anchor for age calculation. Defaults to the current time. */
  now?: string;
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  low: 10,
  medium: 25,
  high: 50,
};

const STATUS_ADJUSTMENT: Record<TaskStatus, number> = {
  todo: 0,
  'in-progress': 15,
  done: -1_000,
};

const AGE_BONUS_PER_DAY = 2;
const MAX_AGE_BONUS = 30;

function resolveNow(options?: ScoreTaskOptions): Date {
  return options?.now ? parseISO(options.now) : new Date();
}

function ageBonus(createdAt: string, now: Date): number {
  const ageDays = Math.max(
    0,
    differenceInCalendarDays(now, parseISO(createdAt)),
  );
  return Math.min(ageDays * AGE_BONUS_PER_DAY, MAX_AGE_BONUS);
}

export function scoreTask(
  task: ScoreableTask,
  options?: ScoreTaskOptions,
): number {
  const now = resolveNow(options);

  return (
    PRIORITY_WEIGHT[task.priority] +
    ageBonus(task.createdAt, now) +
    STATUS_ADJUSTMENT[task.status]
  );
}
