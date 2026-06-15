import { describe, expect, it } from 'vitest';

import { detectStaleTasks } from '@/lib/ai/tools';
import type { Task } from '@/lib/schema';

const NOW = '2026-06-15T12:00:00+03:00';

function task(overrides: Partial<Task> = {}): Task {
  const createdAt = overrides.createdAt ?? '2026-06-10T10:00:00+03:00';

  return {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Task',
    description: '',
    priority: 'medium',
    status: 'in-progress',
    createdAt,
    statusUpdatedAt: overrides.statusUpdatedAt ?? createdAt,
    ...overrides,
  };
}

describe('detectStaleTasks', () => {
  it('returns only in-progress tasks that meet the stale threshold', () => {
    const stale = detectStaleTasks(
      [
        task({
          id: '00000000-0000-4000-8000-000000000001',
          createdAt: '2026-06-01T10:00:00+03:00',
          statusUpdatedAt: '2026-06-01T10:00:00+03:00',
        }),
        task({
          id: '00000000-0000-4000-8000-000000000002',
          status: 'todo',
          createdAt: '2026-06-01T10:00:00+03:00',
        }),
        task({
          id: '00000000-0000-4000-8000-000000000003',
          status: 'done',
          createdAt: '2026-06-01T10:00:00+03:00',
        }),
        task({
          id: '00000000-0000-4000-8000-000000000004',
          createdAt: '2026-06-14T10:00:00+03:00',
          statusUpdatedAt: '2026-06-14T10:00:00+03:00',
        }),
      ],
      { staleDays: 3, now: NOW },
    );

    expect(stale).toHaveLength(1);
    expect(stale[0]?.taskId).toBe('00000000-0000-4000-8000-000000000001');
    expect(stale[0]?.daysInProgress).toBe(14);
  });

  it('uses statusUpdatedAt instead of createdAt for in-progress duration', () => {
    const stale = detectStaleTasks(
      [
        task({
          createdAt: '2026-06-01T10:00:00+03:00',
          statusUpdatedAt: '2026-06-14T10:00:00+03:00',
        }),
      ],
      { staleDays: 3, now: NOW },
    );

    expect(stale).toEqual([]);
  });

  it('includes tasks exactly at the stale threshold', () => {
    const stale = detectStaleTasks(
      [
        task({
          createdAt: '2026-06-12T10:00:00+03:00',
          statusUpdatedAt: '2026-06-12T10:00:00+03:00',
        }),
      ],
      { staleDays: 3, now: NOW },
    );

    expect(stale).toHaveLength(1);
    expect(stale[0]?.daysInProgress).toBe(3);
  });

  it('sorts stale tasks by days in progress descending', () => {
    const stale = detectStaleTasks(
      [
        task({
          id: '00000000-0000-4000-8000-000000000001',
          statusUpdatedAt: '2026-06-10T10:00:00+03:00',
        }),
        task({
          id: '00000000-0000-4000-8000-000000000002',
          statusUpdatedAt: '2026-06-01T10:00:00+03:00',
        }),
      ],
      { staleDays: 3, now: NOW },
    );

    expect(stale.map((entry) => entry.taskId)).toEqual([
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000001',
    ]);
  });

  it('returns an empty array when no tasks are stale', () => {
    const stale = detectStaleTasks(
      [
        task({ status: 'todo' }),
        task({
          createdAt: '2026-06-14T10:00:00+03:00',
          statusUpdatedAt: '2026-06-14T10:00:00+03:00',
        }),
      ],
      { staleDays: 3, now: NOW },
    );

    expect(stale).toEqual([]);
  });
});
