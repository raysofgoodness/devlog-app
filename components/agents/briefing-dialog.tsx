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
import { useBriefingAgent, type BriefingResponse } from '@/hooks/useAgents';

interface BriefingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BriefingDialog({ open, onOpenChange }: BriefingDialogProps) {
  const briefing = useBriefingAgent();
  const [result, setResult] = useState<BriefingResponse | null>(null);

  useEffect(() => {
    if (!open) {
      setResult(null);
    }
  }, [open]);

  const handleGenerate = async () => {
    try {
      const response = await briefing.mutateAsync({
        limit: 5,
        staleDays: 3,
        tone: 'professional',
      });
      setResult(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not generate briefing';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Morning briefing</DialogTitle>
            {result ? <AgentMockBadge isMock={result.isMock} /> : null}
          </div>
          <DialogDescription>
            Multi-step agent: prioritize, stale tasks, and a draft status
            update.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              {result.stepCount} agent steps · {result.provider}
            </p>
            <AgentMarkdown content={result.briefing} />
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
            disabled={briefing.isPending}
          >
            {briefing.isPending ? <Spinner data-icon="inline-start" /> : null}
            {result ? 'Refresh briefing' : 'Generate briefing'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
