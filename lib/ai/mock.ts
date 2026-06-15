import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3GenerateResult,
  LanguageModelV3Prompt,
  LanguageModelV3StreamPart,
  LanguageModelV3StreamResult,
} from '@ai-sdk/provider';
import { MockLanguageModelV3, simulateReadableStream } from 'ai/test';

let mockCallCounter = 0;

function nextMockId(prefix: string): string {
  mockCallCounter += 1;
  return `${prefix}-${mockCallCounter}`;
}

const MOCK_USAGE: LanguageModelV3GenerateResult['usage'] = {
  inputTokens: {
    total: 128,
    noCache: 128,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 256, text: 256, reasoning: undefined },
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function extractPromptText(prompt: LanguageModelV3Prompt): string {
  const parts: string[] = [];

  for (const message of prompt) {
    if (message.role === 'system') {
      parts.push(message.content);
      continue;
    }

    if (message.role === 'user') {
      for (const part of message.content) {
        if (part.type === 'text') {
          parts.push(part.text);
        }
      }
      continue;
    }

    const content =
      message.role === 'assistant' || message.role === 'tool'
        ? message.content
        : [];

    for (const part of content) {
      if (part.type === 'text') {
        parts.push(part.text);
      }

      if (part.type === 'tool-result') {
        const { output } = part;
        if (output.type === 'text') {
          parts.push(output.value);
        } else if (output.type === 'json') {
          parts.push(JSON.stringify(output.value));
        }
      }
    }
  }

  return parts.join('\n');
}

function getCompletedToolNames(prompt: LanguageModelV3Prompt): Set<string> {
  const names = new Set<string>();

  for (const message of prompt) {
    if (message.role !== 'assistant' && message.role !== 'tool') {
      continue;
    }

    for (const part of message.content) {
      if (part.type === 'tool-result') {
        names.add(part.toolName);
      }
    }
  }

  return names;
}

type MockScenario =
  | 'prioritize'
  | 'decompose'
  | 'briefing'
  | 'status'
  | 'generic';

function detectScenario(text: string): MockScenario {
  const normalized = text.toLowerCase();

  if (
    normalized.includes('briefing') ||
    normalized.includes('morning summary') ||
    normalized.includes('daily brief')
  ) {
    return 'briefing';
  }

  if (
    normalized.includes('decompos') ||
    normalized.includes('subtask') ||
    normalized.includes('break down') ||
    normalized.includes('breakdown') ||
    normalized.includes('clarifying question')
  ) {
    return 'decompose';
  }

  if (
    normalized.includes('priorit') ||
    normalized.includes('daily plan') ||
    normalized.includes('plan for today') ||
    normalized.includes('rank tasks')
  ) {
    return 'prioritize';
  }

  if (
    normalized.includes('status update') ||
    normalized.includes('slack update') ||
    normalized.includes('draftstatus')
  ) {
    return 'status';
  }

  return 'generic';
}

function mockToolInput(
  toolName: string,
  promptText: string,
): Record<string, unknown> {
  const hash = hashString(`${toolName}:${promptText}`);

  switch (toolName) {
    case 'prioritize':
      return { limit: 5 };
    case 'detectStale':
      return { staleDays: 3 };
    case 'draftStatusUpdate':
      return {
        taskId: 'mock-task-id',
        tone: hash % 2 === 0 ? 'professional' : 'casual',
      };
    case 'createSubtasks':
      return {
        taskId: 'mock-task-id',
        subtasks: [
          { title: 'Define acceptance criteria' },
          { title: 'Implement core flow' },
          { title: 'Add tests and polish edge cases' },
        ],
      };
    default:
      return { seed: hash % 10_000 };
  }
}

function buildPrioritizeText(promptText: string): string {
  const variant = hashString(promptText) % 3;

  const intros = [
    'Here is a focused plan for today based on priority scores, age, and status penalties.',
    'I ranked the backlog using weighted priority plus age decay, then adjusted for blocked or stale work.',
    'Today should start with the highest-impact items that are ready to move forward.',
  ];

  return `${intros[variant]}

1. **Ship API validation fixes** — high priority and already in progress; finishing this unblocks downstream work.
2. **Write agent prioritization prompt** — medium priority but aging; good win before context switching.
3. **Polish task board filters** — quick UI pass while momentum is high.
4. **Review stale in-progress items** — park or close anything stuck longer than a few days.
5. **Plan tomorrow** — leave 15 minutes to reset the board and capture follow-ups.

**Why this order:** in-progress high-priority work gets a small boost, but very old medium tasks still surface before low-priority polish. Done items are excluded from the active plan.`;
}

function buildDecomposeText(promptText: string, wantsJson: boolean): string {
  const isVague =
    promptText.trim().length < 40 ||
    /\b(tbd|todo|fix|improve|something)\b/i.test(promptText) ||
    hashString(promptText) % 5 === 0;

  if (wantsJson) {
    if (isVague) {
      return JSON.stringify({
        isClear: false,
        questions: [
          'What is the concrete deliverable for this task?',
          'Are there constraints on tech stack or deadline?',
          'What does done look like — demo, PR, or production release?',
        ],
      });
    }

    return JSON.stringify({
      isClear: true,
      proposedSubtasks: [
        'Clarify scope and acceptance criteria',
        'Implement the main workflow',
        'Add validation, tests, and documentation',
      ],
    });
  }

  if (isVague) {
    return `The task needs a bit more detail before decomposition.

1. What is the exact outcome you want by end of day?
2. Which parts are already decided vs still open?
3. Are there dependencies on other tasks or people?

Once you answer these, I can split the work into concrete subtasks.`;
  }

  return `Suggested subtasks:

1. **Clarify scope** — write acceptance criteria and edge cases.
2. **Implement core path** — smallest slice that proves the feature works.
3. **Harden & document** — tests, error states, and a short README note.

Each item is independently completable and ordered for momentum.`;
}

function buildBriefingText(promptText: string): string {
  const day = hashString(promptText) % 7;

  return `## Morning briefing

**Focus (${day + 1} active items)** — start with in-progress high-priority work, then pull one aging medium task before polish.

**Stale watch** — anything in progress for several days should be finished, split, or moved back to todo.

**Suggested Slack status**
> Yesterday: closed a validation gap and synced agent tooling.
> Today: shipping prioritization flow + task board polish.
> Blockers: none — ping me if API keys need rotation.

**Next actions**
- Complete top ranked task before lunch
- Sweep stale in-progress items
- Post the status update to the team channel`;
}

function buildStatusText(): string {
  return `**Status update (professional)**

Progress: core tracker CRUD is stable; agent layer wiring is in progress.
Today: finalize prioritization endpoint and mock provider fallback.
Risks: none blocking — LLM calls degrade gracefully without API keys.
Ask: review the daily plan output format when you have a minute.`;
}

function buildGenericText(promptText: string): string {
  const snippet = promptText.trim().slice(0, 120).replace(/\s+/g, ' ');
  return `Mock LLM response (deterministic).

I processed your request about: "${snippet || 'general assistance'}".

This environment is running without a real API key, so responses are templated but stable across runs.`;
}

function buildTextResponse(
  scenario: MockScenario,
  promptText: string,
  wantsJson: boolean,
): string {
  switch (scenario) {
    case 'prioritize':
      return buildPrioritizeText(promptText);
    case 'decompose':
      return buildDecomposeText(promptText, wantsJson);
    case 'briefing':
      return buildBriefingText(promptText);
    case 'status':
      return buildStatusText();
    default:
      return buildGenericText(promptText);
  }
}

function buildGenerateResult(
  options: LanguageModelV3CallOptions,
): LanguageModelV3GenerateResult {
  const promptText = extractPromptText(options.prompt);
  const scenario = detectScenario(promptText);
  const wantsJson = options.responseFormat?.type === 'json';
  const completedTools = getCompletedToolNames(options.prompt);
  const availableTools =
    options.tools?.filter((tool) => tool.type === 'function') ?? [];
  const pendingTools = availableTools.filter(
    (tool) => !completedTools.has(tool.name),
  );

  if (pendingTools.length > 0) {
    const toolCalls = pendingTools.map((tool) => ({
      type: 'tool-call' as const,
      toolCallId: nextMockId('mock-call'),
      toolName: tool.name,
      input: JSON.stringify(mockToolInput(tool.name, promptText)),
    }));

    return {
      content: toolCalls,
      finishReason: { unified: 'tool-calls', raw: 'tool_calls' },
      usage: MOCK_USAGE,
      warnings: [],
    };
  }

  const text = buildTextResponse(scenario, promptText, wantsJson);

  return {
    content: [{ type: 'text', text }],
    finishReason: { unified: 'stop', raw: 'stop' },
    usage: MOCK_USAGE,
    warnings: [],
  };
}

function buildStreamResult(
  options: LanguageModelV3CallOptions,
): LanguageModelV3StreamResult {
  const generated = buildGenerateResult(options);
  const text = generated.content
    .filter(
      (part): part is { type: 'text'; text: string } => part.type === 'text',
    )
    .map((part) => part.text)
    .join('');

  const toolCalls = generated.content.filter(
    (
      part,
    ): part is Extract<
      (typeof generated.content)[number],
      { type: 'tool-call' }
    > => part.type === 'tool-call',
  );

  const chunks: LanguageModelV3StreamPart[] = [
    { type: 'stream-start', warnings: [] },
  ];

  if (toolCalls.length > 0) {
    for (const call of toolCalls) {
      chunks.push(call);
    }
  } else {
    const textId = nextMockId('text');
    chunks.push({ type: 'text-start', id: textId });
    for (let i = 0; i < text.length; i += 24) {
      chunks.push({
        type: 'text-delta',
        id: textId,
        delta: text.slice(i, i + 24),
      });
    }
    chunks.push({ type: 'text-end', id: textId });
  }

  chunks.push({
    type: 'finish',
    finishReason: generated.finishReason,
    usage: generated.usage,
  });

  return {
    stream: simulateReadableStream({
      chunks,
      initialDelayInMs: null,
      chunkDelayInMs: null,
    }),
  };
}

export function createMockLanguageModel(): LanguageModelV3 {
  return new MockLanguageModelV3({
    provider: 'devlog-mock',
    modelId: 'mock-llm',
    doGenerate: async (options) => buildGenerateResult(options),
    doStream: async (options) => buildStreamResult(options),
  });
}
