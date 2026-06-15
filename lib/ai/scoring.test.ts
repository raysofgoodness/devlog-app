import { describe, expect, it } from 'vitest';

import type { Task } from '@/lib/schema';
import { scoreTask } from '@/lib/ai/scoring';

const NOW = '2026-06-15T12:00:00+03:00';

type ScoreableTask = Pick<Task, 'priority' | 'status' | 'createdAt'>;

function task(overrides: Partial<ScoreableTask> = {}): ScoreableTask {
  return {
    priority: 'medium',
    status: 'todo',
    createdAt: '2026-06-10T10:00:00+03:00',
    ...overrides,
  };
}

describe('scoreTask', () => {
  it('ranks high-priority tasks above low-priority when age and status match', () => {
    const high = task({ priority: 'high' });
    const low = task({ priority: 'low' });

    expect(scoreTask(high, { now: NOW })).toBeGreaterThan(scoreTask(low, { now: NOW }));
  });

  it('ranks older tasks above newer ones when priority and status match', () => {
    const older = task({ createdAt: '2026-06-01T10:00:00+03:00' });
    const newer = task({ createdAt: '2026-06-14T10:00:00+03:00' });

    expect(scoreTask(older, { now: NOW })).toBeGreaterThan(scoreTask(newer, { now: NOW }));
  });

  it('ranks in-progress tasks above todo when priority and age match', () => {
    const inProgress = task({ status: 'in-progress' });
    const todo = task({ status: 'todo' });

    expect(scoreTask(inProgress, { now: NOW })).toBeGreaterThan(
      scoreTask(todo, { now: NOW }),
    );
  });

  it('ranks done tasks below active work', () => {
    const done = task({ status: 'done', priority: 'high' });
    const active = task({ status: 'todo', priority: 'low' });

    expect(scoreTask(done, { now: NOW })).toBeLessThan(scoreTask(active, { now: NOW }));
  });

  it('returns the same score for identical inputs', () => {
    const input = task({ priority: 'high', status: 'in-progress' });
    const first = scoreTask(input, { now: NOW });
    const second = scoreTask(input, { now: NOW });

    expect(first).toBe(second);
    expect(first).toBeGreaterThan(0);
  });

  it('caps age bonus at 30 days', () => {
    const ancient = task({ createdAt: '2025-01-01T10:00:00+03:00' });
    const capped = task({ createdAt: '2026-05-01T10:00:00+03:00' });

    expect(scoreTask(ancient, { now: NOW })).toBe(scoreTask(capped, { now: NOW }));
  });
});
