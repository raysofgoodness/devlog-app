import { describe, expect, it } from 'vitest';

import { scoreAndRankTasks } from '@/lib/ai/prioritize';
import type { Task } from '@/lib/schema';

const NOW = '2026-06-15T12:00:00+03:00';

function task(overrides: Partial<Task> = {}): Task {
  const createdAt = overrides.createdAt ?? '2026-06-10T10:00:00+03:00';

  return {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Task',
    description: '',
    priority: 'medium',
    status: 'todo',
    createdAt,
    statusUpdatedAt: overrides.statusUpdatedAt ?? createdAt,
    ...overrides,
  };
}

describe('scoreAndRankTasks', () => {
  it('excludes done tasks and orders by score descending', () => {
    const ranked = scoreAndRankTasks(
      [
        task({ id: '00000000-0000-4000-8000-000000000001', priority: 'low', status: 'done' }),
        task({ id: '00000000-0000-4000-8000-000000000002', priority: 'high', status: 'todo' }),
        task({ id: '00000000-0000-4000-8000-000000000003', priority: 'medium', status: 'in-progress' }),
      ],
      { now: NOW },
    );

    expect(ranked).toHaveLength(2);
    expect(ranked[0]?.task.priority).toBe('high');
    expect(ranked[0]?.rank).toBe(1);
    expect(ranked[1]?.rank).toBe(2);
    expect(ranked[0]?.score).toBeGreaterThan(ranked[1]?.score ?? 0);
  });
});
