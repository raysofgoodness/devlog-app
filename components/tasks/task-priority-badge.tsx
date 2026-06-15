import { Badge } from '@/components/ui/badge';
import { TASK_PRIORITY_LABELS } from '@/lib/task-ui';
import type { TaskPriority } from '@/lib/schema';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function TaskPriorityBadge({
  priority,
  className,
}: TaskPriorityBadgeProps) {
  return (
    <Badge
      variant={priority === 'high' ? 'destructive' : 'outline'}
      className={className}
    >
      {TASK_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
