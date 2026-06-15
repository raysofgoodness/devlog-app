import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

import { createMockLanguageModel } from "@/lib/ai/mock";

export type LlmProviderName = "openai" | "anthropic" | "google" | "mock";

export interface LlmProviderConfig {
  provider: LlmProviderName;
  modelId: string;
  isMock: boolean;
}

const DEFAULT_MODEL_BY_PROVIDER = {
  openai: "gpt-4.1-mini",
  anthropic: "claude-sonnet-4-20250514",
  google: "gemini-2.5-flash",
  mock: "mock-llm",
} as const satisfies Record<LlmProviderName, string>;

function readEnvProvider(): "openai" | "anthropic" | "google" {
  const raw = process.env.LLM_PROVIDER?.trim().toLowerCase();
  return raw === "anthropic"
    ? "anthropic"
    : raw === "google"
      ? "google"
      : "openai";
}

function hasApiKey(provider: "openai" | "anthropic" | "google"): boolean {
  if (provider === "openai") {
    return Boolean(process.env.OPENAI_API_KEY?.trim());
  }
  if (provider === "anthropic") {
    return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  }
  if (provider === "google") {
    return Boolean(process.env.GOOGLE_API_KEY?.trim());
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
      provider: "mock",
      modelId: resolveModelId("mock"),
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

  if (config.provider === "anthropic") {
    return anthropic(config.modelId);
  }

  if (config.provider === "google") {
    return google(config.modelId);
  }

  return openai(config.modelId);
}
