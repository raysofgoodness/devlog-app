'use client';

import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { AgentsPanel } from '@/components/agents/agents-panel';
import { DeleteConfirm } from '@/components/tasks/delete-confirm';
import { TaskFilters } from '@/components/tasks/task-filters';
import { TaskForm } from '@/components/tasks/task-form';
import { TaskList } from '@/components/tasks/task-list';
import { Button } from '@/components/ui/button';
import {
  useDeleteTask,
  useTasks,
} from '@/hooks/useTasks';
import type { Task, TaskStatus } from '@/lib/schema';
import type { SortOption, StatusFilter } from '@/lib/task-ui';

export function TasksBoard() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOption>('createdAt');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [decomposeTask, setDecomposeTask] = useState<Task | undefined>();

  const listParams = {
    status: statusFilter === 'all' ? undefined : (statusFilter as TaskStatus),
    sort,
  };

  const { data, isLoading, isError, error } = useTasks(listParams);
  const { data: allTasks } = useTasks({ sort });
  const deleteTask = useDeleteTask();

  const openCreateForm = () => {
    setFormMode('create');
    setEditingTask(undefined);
    setFormOpen(true);
  };

  const openEditForm = (task: Task) => {
    setFormMode('edit');
    setEditingTask(task);
    setFormOpen(true);
  };

  const openDeleteConfirm = (task: Task) => {
    setDeletingTask(task);
  };

  const openDecompose = (task: Task) => {
    setDecomposeTask(task);
  };

  const handleDelete = async () => {
    if (!deletingTask) {
      return;
    }

    try {
      await deleteTask.mutateAsync(deletingTask.id);
      toast.success('Task deleted');
      setDeletingTask(null);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete task';
      toast.error(message);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Your tasks
          </h2>
          <p className="text-sm text-muted-foreground">
            Filter, sort, and manage work in one place.
          </p>
        </div>
        <Button onClick={openCreateForm} className="w-full sm:w-auto">
          <PlusIcon data-icon="inline-start" />
          New task
        </Button>
      </div>

      <AgentsPanel
        tasks={allTasks ?? []}
        decomposeTask={decomposeTask}
        onDecomposeOpenChange={(open) => {
          if (!open) {
            setDecomposeTask(undefined);
          }
        }}
      />

      <TaskFilters
        status={statusFilter}
        sort={sort}
        onStatusChange={setStatusFilter}
        onSortChange={setSort}
      />

      <TaskList
        tasks={data}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        onEdit={openEditForm}
        onDelete={openDeleteConfirm}
        onDecompose={openDecompose}
      />

      <TaskForm
        mode={formMode}
        task={editingTask}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <DeleteConfirm
        task={deletingTask}
        open={deletingTask !== null}
        isPending={deleteTask.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingTask(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </section>
  );
}
