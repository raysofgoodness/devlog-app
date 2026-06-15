'use client';

import { PlusIcon } from 'lucide-react';

import { AgentsPanel } from '@/components/agents/agents-panel';
import { DeleteConfirm } from '@/components/tasks/delete-confirm';
import { TaskFilters } from '@/components/tasks/task-filters';
import { TaskForm } from '@/components/tasks/task-form';
import { TaskList } from '@/components/tasks/task-list';
import { Button } from '@/components/ui/button';
import { useTasksBoardUi } from '@/hooks/useTasksBoardUi';

export function TasksBoard() {
  const board = useTasksBoardUi();

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Your tasks
          </h2>
          <p className="text-sm text-muted-foreground">
            Filter, sort, and manage work in one place.
          </p>
        </div>
        <Button onClick={board.openCreateForm} className="w-full sm:w-auto">
          <PlusIcon data-icon="inline-start" />
          New task
        </Button>
      </div>

      <AgentsPanel
        tasks={board.tasks}
        decomposeTask={board.decomposeTask}
        onDecomposeOpenChange={(open) => {
          if (!open) {
            board.closeDecompose();
          }
        }}
      />

      <TaskFilters
        status={board.statusFilter}
        sort={board.sort}
        onStatusChange={board.setStatusFilter}
        onSortChange={board.setSort}
      />

      <TaskList
        tasks={board.filteredTasks}
        isLoading={board.isLoading}
        isError={board.isError}
        errorMessage={
          board.error instanceof Error ? board.error.message : undefined
        }
        onEdit={board.openEditForm}
        onDelete={board.openDeleteConfirm}
        onDecompose={board.openDecompose}
      />

      <TaskForm
        mode={board.formMode}
        task={board.editingTask}
        open={board.formOpen}
        onOpenChange={board.setFormOpen}
      />

      <DeleteConfirm
        task={board.deletingTask}
        open={board.deletingTask !== null}
        isPending={board.deleteIsPending}
        onOpenChange={(open) => {
          if (!open) {
            board.closeDeleteConfirm();
          }
        }}
        onConfirm={board.handleDelete}
      />
    </section>
  );
}
