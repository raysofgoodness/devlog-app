import type { LlmProviderName } from '@/lib/ai/provider';
import type { Subtask, Task } from '@/lib/schema';

export interface AgentMeta {
  generatedAt: string;
  provider: LlmProviderName;
  isMock: boolean;
}

export interface PrioritizeResponse extends AgentMeta {
  plan: string;
  scoredTasks: Array<{
    taskId: string;
    title: string;
    status: Task['status'];
    priority: Task['priority'];
    createdAt: string;
    score: number;
    rank: number;
  }>;
}

export interface BriefingResponse extends AgentMeta {
  briefing: string;
  toolData: {
    prioritize?: unknown;
    detectStale?: unknown;
    draftStatusUpdate?: unknown;
  };
  stepCount: number;
}

export type DecomposeResponse =
  | ({
      kind: 'questions';
      taskId: string;
      taskTitle: string;
      questions: string[];
    } & AgentMeta)
  | ({
      kind: 'proposal';
      taskId: string;
      taskTitle: string;
      proposedSubtasks: string[];
    } & AgentMeta)
  | ({
      kind: 'created';
      taskId: string;
      taskTitle: string;
      subtasks: Subtask[];
    } & AgentMeta);
