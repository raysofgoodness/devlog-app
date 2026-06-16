'use client';

import { format, parseISO } from 'date-fns';
import { ListTreeIcon, PencilIcon, Trash2Icon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDeleteSubtask, useToggleSubtask } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import type { TaskWithSubtasks } from '@/lib/schema';

interface TaskCardProps {
  task: TaskWithSubtasks;
  onEdit: (task: TaskWithSubtasks) => void;
  onDelete: (task: TaskWithSubtasks) => void;
  onDecompose?: (task: TaskWithSubtasks) => void;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onDecompose,
}: TaskCardProps) {
  const toggleSubtask = useToggleSubtask();
  const deleteSubtask = useDeleteSubtask();
  const createdLabel = format(parseISO(task.createdAt), 'MMM d, yyyy');
  const subtasks = task.subtasks ?? [];
  const doneSubtasks = subtasks.filter((subtask) => subtask.status === 'done');
  const progressValue =
    subtasks.length > 0
      ? Math.round((doneSubtasks.length / subtasks.length) * 100)
      : 0;

  const handleToggleSubtask = async (subtaskId: string) => {
    try {
      await toggleSubtask.mutateAsync(subtaskId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not update subtask';
      toast.error(message);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await deleteSubtask.mutateAsync(subtaskId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not delete subtask';
      toast.error(message);
    }
  };

  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <TaskStatusBadge status={task.status} />
          <TaskPriorityBadge priority={task.priority} />
          {subtasks.length > 0 ? (
            <span className="font-mono text-xs text-muted-foreground">
              {doneSubtasks.length}/{subtasks.length}
            </span>
          ) : null}
        </div>
        <CardTitle className="text-lg leading-snug">{task.title}</CardTitle>
        {task.description ? (
          <CardDescription
            className={cn(
              'text-sm leading-relaxed',
              subtasks.length > 0 ? 'line-clamp-2' : 'line-clamp-3',
            )}
          >
            {task.description}
          </CardDescription>
        ) : null}
      </CardHeader>

      {subtasks.length > 0 ? (
        <CardContent className="flex flex-col gap-3 pt-0">
          <Progress value={progressValue} className="gap-1.5">
            <span className="text-xs text-muted-foreground">Subtasks</span>
          </Progress>
          <ul
            className="max-h-32 space-y-2 overflow-y-auto rounded-lg border bg-muted/20 p-3"
          >
            {subtasks.map((subtask) => {
              const isDone = subtask.status === 'done';
              const isToggling =
                toggleSubtask.isPending &&
                toggleSubtask.variables === subtask.id;
              const isDeleting =
                deleteSubtask.isPending &&
                deleteSubtask.variables === subtask.id;

              return (
                <li key={subtask.id} className="group flex items-start gap-2">
                  <Checkbox
                    checked={isDone}
                    disabled={isToggling || isDeleting}
                    className="mt-0.5"
                    onCheckedChange={() => {
                      void handleToggleSubtask(subtask.id);
                    }}
                    aria-label={`Mark "${subtask.title}" as ${isDone ? 'todo' : 'done'}`}
                  />
                  <span
                    className={cn(
                      'min-w-0 flex-1 pt-0.5 text-sm leading-snug',
                      isDone && 'text-muted-foreground line-through',
                    )}
                  >
                    {subtask.title}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="mt-0.5 size-4 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    disabled={isToggling || isDeleting}
                    onClick={() => {
                      void handleDeleteSubtask(subtask.id);
                    }}
                    aria-label={`Delete subtask ${subtask.title}`}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      ) : null}

      <CardFooter className="flex-col gap-2 border-t bg-muted/30">
        <div className="flex w-full gap-2">
          {onDecompose && task.status !== 'done' ? (
            <Button
              variant="outline"
              size="sm"
              className="min-w-0 flex-1"
              onClick={() => onDecompose(task)}
              aria-label={`Decompose ${task.title}`}
            >
              <ListTreeIcon data-icon="inline-start" />
              Decompose
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="min-w-0 flex-1"
            onClick={() => onEdit(task)}
            aria-label={`Edit ${task.title}`}
          >
            <PencilIcon data-icon="inline-start" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="min-w-0 flex-1"
            onClick={() => onDelete(task)}
            aria-label={`Delete ${task.title}`}
          >
            <Trash2Icon data-icon="inline-start" />
            Delete
          </Button>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          Created {createdLabel}
        </p>
      </CardFooter>
    </Card>
  );
}
