import type { Subtask, Task, TaskWithSubtasks } from '@/lib/schema';
import { listSubtasksForTaskIds } from '@/lib/repo/subtasks';

export function attachSubtasksToTasks(tasks: Task[]): TaskWithSubtasks[] {
  const subtasks = listSubtasksForTaskIds(tasks.map((task) => task.id));
  const subtasksByTaskId = new Map<string, Subtask[]>();

  for (const subtask of subtasks) {
    const existing = subtasksByTaskId.get(subtask.taskId) ?? [];
    existing.push(subtask);
    subtasksByTaskId.set(subtask.taskId, existing);
  }

  return tasks.map((task) => ({
    ...task,
    subtasks: subtasksByTaskId.get(task.id) ?? [],
  }));
}

export function attachSubtasksToTask(task: Task): TaskWithSubtasks {
  return attachSubtasksToTasks([task])[0]!;
}
