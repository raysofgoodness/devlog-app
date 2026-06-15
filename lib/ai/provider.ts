import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { groq, type GroqProviderOptions } from '@ai-sdk/groq';
import type { LanguageModel } from 'ai';
import { extractJsonMiddleware, wrapLanguageModel } from 'ai';

import { createMockLanguageModel } from '@/lib/ai/mock';

export type LlmProviderName =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'groq'
  | 'mock';

export interface LlmProviderConfig {
  provider: LlmProviderName;
  modelId: string;
  isMock: boolean;
}

const DEFAULT_MODEL_BY_PROVIDER = {
  openai: 'gpt-4.1-mini',
  anthropic: 'claude-sonnet-4-20250514',
  google: 'gemini-2.0-flash',
  groq: 'openai/gpt-oss-20b',
  mock: 'mock-llm',
} as const satisfies Record<LlmProviderName, string>;

/** Models that accept Groq `response_format: json_schema`. Others fall back to `json_object`. */
const GROQ_STRUCTURED_OUTPUT_MODELS = new Set([
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-safeguard-20b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
]);

export function groqSupportsStructuredOutputs(modelId: string): boolean {
  return GROQ_STRUCTURED_OUTPUT_MODELS.has(modelId);
}

export function getGroqProviderOptions(modelId: string): {
  groq: GroqProviderOptions;
} {
  const structuredOutputs = groqSupportsStructuredOutputs(modelId);

  return {
    groq: {
      structuredOutputs,
      // Zod schemas use optional fields; Groq strict mode rejects those.
      ...(structuredOutputs ? { strictJsonSchema: false } : {}),
    },
  };
}

export function getLlmProviderOptions():
  | { groq: GroqProviderOptions }
  | undefined {
  const config = getLlmProviderConfig();

  if (config.provider === 'groq') {
    return getGroqProviderOptions(config.modelId);
  }

  return undefined;
}
function readEnvProvider(): 'openai' | 'anthropic' | 'google' | 'groq' {
  const raw = process.env.LLM_PROVIDER?.trim().toLowerCase();
  return raw === 'anthropic'
    ? 'anthropic'
    : raw === 'google'
      ? 'google'
      : raw === 'groq'
        ? 'groq'
        : 'openai';
}

function hasApiKey(
  provider: 'openai' | 'anthropic' | 'google' | 'groq',
): boolean {
  if (provider === 'openai') {
    return Boolean(process.env.OPENAI_API_KEY?.trim());
  }
  if (provider === 'anthropic') {
    return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  }
  if (provider === 'google') {
    return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
  }
  if (provider === 'groq') {
    return Boolean(process.env.GROQ_API_KEY?.trim());
  }
  return false;
}

function resolveModelId(provider: LlmProviderName): string {
  const fromEnv = process.env.AI_MODEL?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return DEFAULT_MODEL_BY_PROVIDER[provider];
}

export function getLlmProviderConfig(): LlmProviderConfig {
  const requested = readEnvProvider();

  if (!hasApiKey(requested)) {
    return {
      provider: 'mock',
      modelId: resolveModelId('mock'),
      isMock: true,
    };
  }

  return {
    provider: requested,
    modelId: resolveModelId(requested),
    isMock: false,
  };
}

export function isMockMode(): boolean {
  return getLlmProviderConfig().isMock;
}

export function getLanguageModel(): LanguageModel {
  const config = getLlmProviderConfig();

  if (config.isMock) {
    return createMockLanguageModel();
  }

  if (config.provider === 'anthropic') {
    return anthropic(config.modelId);
  }

  if (config.provider === 'google') {
    return google(config.modelId);
  }

  if (config.provider === 'groq') {
    const model = groq(config.modelId);

    if (!groqSupportsStructuredOutputs(config.modelId)) {
      return wrapLanguageModel({
        model,
        middleware: extractJsonMiddleware(),
      });
    }

    return model;
  }

  return openai(config.modelId);
}
