'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { useDeleteTask, useTasks } from '@/hooks/useTasks';
import type { TaskWithSubtasks } from '@/lib/schema';
import type { SortOption, StatusFilter } from '@/lib/task-ui';

export function useTasksBoardUi() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOption>('createdAt');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingTask, setEditingTask] = useState<TaskWithSubtasks | undefined>();
  const [deletingTask, setDeletingTask] = useState<TaskWithSubtasks | null>(null);
  const [decomposeTask, setDecomposeTask] = useState<TaskWithSubtasks | undefined>();

  const { data, isLoading, isError, error } = useTasks({ sort });
  const deleteTask = useDeleteTask();

  const filteredTasks =
    statusFilter === 'all'
      ? data
      : data?.filter((task) => task.status === statusFilter);

  const openCreateForm = useCallback(() => {
    setFormMode('create');
    setEditingTask(undefined);
    setFormOpen(true);
  }, []);

  const openEditForm = useCallback((task: TaskWithSubtasks) => {
    setFormMode('edit');
    setEditingTask(task);
    setFormOpen(true);
  }, []);

  const openDeleteConfirm = useCallback((task: TaskWithSubtasks) => {
    setDeletingTask(task);
  }, []);

  const openDecompose = useCallback((task: TaskWithSubtasks) => {
    setDecomposeTask(task);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeletingTask(null);
  }, []);

  const closeDecompose = useCallback(() => {
    setDecomposeTask(undefined);
  }, []);

  const handleDelete = useCallback(async () => {
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
  }, [deleteTask, deletingTask]);

  return {
    statusFilter,
    setStatusFilter,
    sort,
    setSort,
    tasks: data ?? [],
    filteredTasks,
    isLoading,
    isError,
    error,
    formOpen,
    setFormOpen,
    formMode,
    editingTask,
    deletingTask,
    deleteIsPending: deleteTask.isPending,
    decomposeTask,
    openCreateForm,
    openEditForm,
    openDeleteConfirm,
    openDecompose,
    closeDeleteConfirm,
    closeDecompose,
    handleDelete,
  };
}
