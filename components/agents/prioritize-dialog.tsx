'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AgentMarkdown } from '@/components/agents/agent-markdown';
import { AgentMockBadge } from '@/components/agents/agent-mock-badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { usePrioritizeAgent, type PrioritizeResponse } from '@/hooks/useAgents';

interface PrioritizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrioritizeDialog({
  open,
  onOpenChange,
}: PrioritizeDialogProps) {
  const prioritize = usePrioritizeAgent();
  const [result, setResult] = useState<PrioritizeResponse | null>(null);

  useEffect(() => {
    if (!open) {
      setResult(null);
    }
  }, [open]);

  const handleGenerate = async () => {
    try {
      const response = await prioritize.mutateAsync({ limit: 8 });
      setResult(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not generate plan';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Plan for the day</DialogTitle>
            {result ? <AgentMockBadge isMock={result.isMock} /> : null}
          </div>
          <DialogDescription>
            Deterministic scoring plus an AI explanation of today&apos;s focus
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-4">
            <AgentMarkdown content={result.plan} />
            {result.scoredTasks.length > 0 ? (
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Scored backlog
                </p>
                <ol className="space-y-2 text-sm">
                  {result.scoredTasks.map((task) => (
                    <li
                      key={task.taskId}
                      className="flex items-start justify-between gap-3"
                    >
                      <span>
                        <span className="font-mono text-xs text-muted-foreground">
                          #{task.rank}
                        </span>{' '}
                        {task.title}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {task.score}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={prioritize.isPending}
          >
            {prioritize.isPending ? <Spinner data-icon="inline-start" /> : null}
            {result ? 'Regenerate' : 'Generate plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
