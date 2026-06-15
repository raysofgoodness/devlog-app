'use client';

import { TaskCard } from '@/components/tasks/task-card';
import { TaskListEmpty } from '@/components/tasks/task-list-empty';
import { TaskListSkeleton } from '@/components/tasks/task-list-skeleton';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Task } from '@/lib/schema';

interface TaskListProps {
  tasks: Task[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskList({
  tasks,
  isLoading,
  isError,
  errorMessage,
  onEdit,
  onDelete,
}: TaskListProps) {
  if (isLoading) {
    return <TaskListSkeleton />;
  }

  if (isError) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Could not load tasks</CardTitle>
          <CardDescription>
            {errorMessage ?? 'Something went wrong. Try refreshing the page.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!tasks?.length) {
    return <TaskListEmpty />;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}
