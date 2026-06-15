import { Badge } from '@/components/ui/badge';
import { TASK_STATUS_LABELS } from '@/lib/task-ui';
import type { TaskStatus } from '@/lib/schema';

const STATUS_VARIANTS: Record<TaskStatus, 'secondary' | 'outline' | 'default'> =
  {
    todo: 'secondary',
    'in-progress': 'outline',
    done: 'default',
  };

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className={className}>
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}
