'use client';

import { format, parseISO } from 'date-fns';
import { ListTreeIcon, PencilIcon, Trash2Icon } from 'lucide-react';

import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Task } from '@/lib/schema';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDecompose?: (task: Task) => void;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onDecompose,
}: TaskCardProps) {
  const createdLabel = format(parseISO(task.createdAt), 'MMM d, yyyy');

  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
        </div>
        <CardTitle className="text-lg leading-snug">{task.title}</CardTitle>
        {task.description ? (
          <CardDescription className="line-clamp-3 text-sm leading-relaxed">
            {task.description}
          </CardDescription>
        ) : null}
      </CardHeader>

      <CardContent className="pt-0">
        <p className="font-mono text-xs text-muted-foreground">
          Created {createdLabel}
        </p>
      </CardContent>

      <CardFooter className="flex-wrap gap-2 border-t bg-muted/30">
        {onDecompose && task.status !== 'done' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDecompose(task)}
            aria-label={`Decompose ${task.title}`}
          >
            <ListTreeIcon data-icon="inline-start" />
            Split
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.title}`}
        >
          <PencilIcon data-icon="inline-start" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(task)}
          aria-label={`Delete ${task.title}`}
        >
          <Trash2Icon data-icon="inline-start" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
