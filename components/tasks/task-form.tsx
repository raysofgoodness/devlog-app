'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateTask,
  useUpdateTask,
} from '@/hooks/useTasks';
import {
  taskFormSchema,
  type Task,
  type TaskFormValues,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/schema';
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from '@/lib/task-ui';

const STATUS_OPTIONS = ['todo', 'in-progress', 'done'] as const satisfies readonly TaskStatus[];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'] as const satisfies readonly TaskPriority[];

const DEFAULT_VALUES: TaskFormValues = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
};

interface TaskFormProps {
  mode: 'create' | 'edit';
  task?: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskForm({ mode, task, open, onOpenChange }: TaskFormProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isPending = createTask.isPending || updateTask.isPending;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && task) {
      form.reset({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
      });
      return;
    }

    form.reset(DEFAULT_VALUES);
  }, [form, mode, open, task]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      if (mode === 'create') {
        await createTask.mutateAsync(values);
        toast.success('Task created');
      } else if (task) {
        await updateTask.mutateAsync({ id: task.id, input: values });
        toast.success('Task updated');
      }

      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'New task' : 'Edit task'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Capture what you need to ship next.'
              : 'Update details and keep the board in sync.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.title}>
              <FieldLabel htmlFor="task-title">Title</FieldLabel>
              <Input
                id="task-title"
                aria-invalid={!!form.formState.errors.title}
                {...form.register('title')}
              />
              <FieldError errors={[form.formState.errors.title]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.description}>
              <FieldLabel htmlFor="task-description">Description</FieldLabel>
              <Textarea
                id="task-description"
                rows={4}
                aria-invalid={!!form.formState.errors.description}
                {...form.register('description')}
              />
              <FieldError errors={[form.formState.errors.description]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor="task-status">Status</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <SelectTrigger id="task-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {TASK_STATUS_LABELS[status]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="priority"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel htmlFor="task-priority">Priority</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <SelectTrigger id="task-priority" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {PRIORITY_OPTIONS.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {TASK_PRIORITY_LABELS[priority]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              {mode === 'create' ? 'Create task' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
