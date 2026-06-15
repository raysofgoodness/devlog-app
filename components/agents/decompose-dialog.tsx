"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AgentMockBadge } from "@/components/agents/agent-mock-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useDecomposeAgent, type DecomposeResponse } from "@/hooks/useAgents";
import { parseAnswerLines } from "@/lib/ai/parse-answers";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/schema";

interface DecomposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  initialTask?: Task;
}

export function DecomposeDialog({
  open,
  onOpenChange,
  tasks,
  initialTask,
}: DecomposeDialogProps) {
  const decompose = useDecomposeAgent();
  const [taskId, setTaskId] = useState<string>("");
  const [result, setResult] = useState<DecomposeResponse | null>(null);
  const [answersText, setAnswersText] = useState("");

  useEffect(() => {
    if (!open) {
      setResult(null);
      setAnswersText("");
      setTaskId("");
    }
  }, [open]);

  const selectableTasks = useMemo(() => {
    const active = tasks.filter((task) => task.status !== "done");

    if (initialTask && !active.some((task) => task.id === initialTask.id)) {
      return [initialTask, ...active];
    }

    return active;
  }, [tasks, initialTask]);

  const effectiveTaskId =
    taskId ||
    (open && initialTask ? initialTask.id : "") ||
    selectableTasks[0]?.id ||
    "";

  const selectedTask =
    selectableTasks.find((task) => task.id === effectiveTaskId) ??
    initialTask;

  const runAnalyze = async (answers?: string[]) => {
    const id = effectiveTaskId;

    if (!id) {
      toast.error("Select a task first");
      return;
    }

    try {
      const response = await decompose.mutateAsync({
        taskId: id,
        answers,
      });
      setResult(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not analyze task";
      toast.error(message);
    }
  };

  const handleCreateSubtasks = async () => {
    if (result?.kind !== "proposal") {
      return;
    }

    try {
      const response = await decompose.mutateAsync({
        taskId: result.taskId,
        confirm: true,
        subtasks: result.proposedSubtasks,
      });

      if (response.kind === "created") {
        setResult(response);
        toast.success(`Created ${response.subtasks.length} subtasks`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not create subtasks";
      toast.error(message);
    }
  };

  const handleSubmitAnswers = async () => {
    const answers = parseAnswerLines(answersText);

    if (answers.length === 0) {
      toast.error("Add at least one answer");
      return;
    }

    await runAnalyze(answers);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Decompose task</DialogTitle>
            {result ? <AgentMockBadge isMock={result.isMock} /> : null}
          </div>
          <DialogDescription>
            Classify clarity, ask follow-ups, then create subtasks when ready.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="decompose-task">Task</FieldLabel>
            <Select
              value={effectiveTaskId}
              onValueChange={(value) => {
                if (value) {
                  setTaskId(value);
                }
              }}
              disabled={decompose.isPending || result?.kind === "created"}
            >
              <SelectTrigger id="decompose-task" className="w-full">
                <span
                  className={cn(
                    "flex flex-1 truncate text-left",
                    !selectedTask && "text-muted-foreground",
                  )}
                >
                  {selectedTask?.title ?? "Select a task"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {selectableTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          {result?.kind === "questions" ? (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">
                Clarifying questions for &ldquo;{result.taskTitle}&rdquo;
              </p>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                {result.questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ol>
              <Field>
                <FieldLabel htmlFor="decompose-answers">
                  Your answers (one per line)
                </FieldLabel>
                <Textarea
                  id="decompose-answers"
                  rows={4}
                  value={answersText}
                  onChange={(event) => setAnswersText(event.target.value)}
                  placeholder="Deliverable is an API route&#10;Deadline is Friday&#10;Done = merged PR"
                />
              </Field>
            </div>
          ) : null}

          {result?.kind === "proposal" ? (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">
                Proposed subtasks for &ldquo;{result.taskTitle}&rdquo;
              </p>
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                {result.proposedSubtasks.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ol>
            </div>
          ) : null}

          {result?.kind === "created" ? (
            <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium">
                Created {result.subtasks.length} subtasks for &ldquo;
                {result.taskTitle}&rdquo;
              </p>
              <ul className="space-y-1 text-sm">
                {result.subtasks.map((subtask) => (
                  <li key={subtask.id} className="text-muted-foreground">
                    {subtask.title}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          {result?.kind === "questions" ? (
            <Button
              type="button"
              onClick={handleSubmitAnswers}
              disabled={decompose.isPending}
            >
              {decompose.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              Submit answers
            </Button>
          ) : null}

          {result?.kind === "proposal" ? (
            <Button
              type="button"
              onClick={handleCreateSubtasks}
              disabled={decompose.isPending}
            >
              {decompose.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              Create subtasks
            </Button>
          ) : null}

          {result?.kind !== "questions" && result?.kind !== "proposal" ? (
            <Button
              type="button"
              onClick={() => runAnalyze()}
              disabled={decompose.isPending || selectableTasks.length === 0}
            >
              {decompose.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              {result?.kind === "created" ? "Analyze again" : "Analyze task"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
