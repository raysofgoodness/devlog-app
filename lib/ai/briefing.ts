import { formatISO } from 'date-fns';
import { z } from 'zod';

import { getLlmProviderConfig, getLanguageModel } from '@/lib/ai/provider';
import {
  createBriefingTools,
  statusUpdateToneSchema,
} from '@/lib/ai/tools';

export const briefingRequestSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  staleDays: z.number().int().min(1).max(90).optional(),
  tone: statusUpdateToneSchema.optional(),
});

export type BriefingRequest = z.infer<typeof briefingRequestSchema>;

export interface BriefingResult {
  briefing: string;
  toolData: {
    prioritize?: unknown;
    detectStale?: unknown;
    draftStatusUpdate?: unknown;
  };
  stepCount: number;
  generatedAt: string;
  provider: ReturnType<typeof getLlmProviderConfig>['provider'];
  isMock: boolean;
}

const BRIEFING_SYSTEM = `You are the DevLog Daily Briefing orchestrator.

You MUST use tools before writing the final answer:
1. prioritize — ranked active tasks by deterministic score
2. detectStale — in-progress tasks stuck too long
3. draftStatusUpdate — Slack-style team status draft

Then synthesize one markdown morning briefing that combines all tool outputs.

Required sections:
## Focus today
## Stale watch
## Suggested status update
## Next actions

Be concise and actionable. Reference real task titles from tool results.`;

function buildBriefingPrompt(input: BriefingRequest): string {
  const limit = input.limit ?? 5;
  const staleDays = input.staleDays ?? 3;
  const tone = input.tone ?? 'professional';

  return `Create today's DevLog morning briefing.

Tool parameters:
- prioritize: { "limit": ${limit} }
- detectStale: { "staleDays": ${staleDays} }
- draftStatusUpdate: { "tone": "${tone}" } (omit taskId for a team-wide pulse)

Call all three tools, then write the final markdown briefing.`;
}

function collectToolData(
  toolResults: Array<{ toolName: string; output: unknown }>,
): BriefingResult['toolData'] {
  const data: BriefingResult['toolData'] = {};

  for (const result of toolResults) {
    if (result.toolName === 'prioritize') {
      data.prioritize = result.output;
    }

    if (result.toolName === 'detectStale') {
      data.detectStale = result.output;
    }

    if (result.toolName === 'draftStatusUpdate') {
      data.draftStatusUpdate = result.output;
    }
  }

  return data;
}

export async function generateDailyBriefing(
  input: BriefingRequest = {},
): Promise<BriefingResult> {
  const providerConfig = getLlmProviderConfig();
  const generatedAt = formatISO(new Date());
  const { generateText, stepCountIs } = await import('ai');

  const tools = createBriefingTools();

  const { text, toolResults, steps } = await generateText({
    model: getLanguageModel(),
    system: BRIEFING_SYSTEM,
    prompt: buildBriefingPrompt(input),
    tools,
    stopWhen: stepCountIs(8),
  });

  return {
    briefing: text,
    toolData: collectToolData(toolResults),
    stepCount: steps.length,
    generatedAt,
    provider: providerConfig.provider,
    isMock: providerConfig.isMock,
  };
}
