"use client";

import { CalendarDaysIcon, ListTreeIcon, SunriseIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { BriefingDialog } from "@/components/agents/briefing-dialog";
import { DecomposeDialog } from "@/components/agents/decompose-dialog";
import { PrioritizeDialog } from "@/components/agents/prioritize-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Task } from "@/lib/schema";

interface AgentsPanelProps {
  tasks: Task[];
  decomposeTask?: Task;
  onDecomposeOpenChange?: (open: boolean) => void;
}

export function AgentsPanel({
  tasks,
  decomposeTask,
  onDecomposeOpenChange,
}: AgentsPanelProps) {
  const [prioritizeOpen, setPrioritizeOpen] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [decomposeOpen, setDecomposeOpen] = useState(false);

  const handleDecomposeOpenChange = (open: boolean) => {
    setDecomposeOpen(open);
    onDecomposeOpenChange?.(open);
  };

  useEffect(() => {
    if (decomposeTask) {
      setDecomposeOpen(true);
    }
  }, [decomposeTask]);

  return (
    <>
      <Card>
        <CardHeader className="gap-1">
          <CardTitle className="text-base">AI assistants</CardTitle>
          <CardDescription>
            Prioritize, decompose, and get a morning briefing from your backlog.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            variant="secondary"
            className="justify-start"
            onClick={() => setPrioritizeOpen(true)}
          >
            <CalendarDaysIcon data-icon="inline-start" />
            Plan for the day
          </Button>
          <Button
            variant="secondary"
            className="justify-start"
            onClick={() => handleDecomposeOpenChange(true)}
          >
            <ListTreeIcon data-icon="inline-start" />
            Decompose task
          </Button>
          <Button
            variant="secondary"
            className="justify-start"
            onClick={() => setBriefingOpen(true)}
          >
            <SunriseIcon data-icon="inline-start" />
            Morning briefing
          </Button>
        </CardContent>
      </Card>

      <PrioritizeDialog
        open={prioritizeOpen}
        onOpenChange={setPrioritizeOpen}
      />
      <BriefingDialog open={briefingOpen} onOpenChange={setBriefingOpen} />
      <DecomposeDialog
        open={decomposeOpen}
        onOpenChange={handleDecomposeOpenChange}
        tasks={tasks}
        initialTask={decomposeTask}
      />
    </>
  );
}
