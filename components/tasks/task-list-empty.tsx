import { ListTodoIcon } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function TaskListEmpty() {
  return (
    <Card className="border-dashed">
      <CardHeader className="items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <ListTodoIcon />
        </div>
        <CardTitle>No tasks yet</CardTitle>
        <CardDescription className="max-w-sm mx-auto">
          Create your first task to start tracking work. Filters may also hide
          matching items.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
