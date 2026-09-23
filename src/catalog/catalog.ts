/**
 * The curated Vikey.ai model catalog — the *single source of truth*
 * for provider identity and model metadata.
 *
 * Everything that needs model data (extension provider registration,
 * models.json generation, CLI output, markdown formatting) reads from
 * this module. Never duplicate the catalog elsewhere.
 */

import type { ModelCategory, VikeyModelDefinition } from "./types.js";

// ── Provider identity ───────────────────────────────────────────

/** Base URL of the Vikey.ai OpenAI-compatible endpoint. */
export const VIKEY_DEFAULT_BASE_URL = "https://api.vikey.ai/v1";

/** Provider id registered in pi (`vikey/<model-id>`). */
export const VIKEY_PROVIDER_ID = "vikey";

/** Human-friendly provider name shown in pi's UI. */
export const VIKEY_PROVIDER_NAME = "Vikey.ai";

// ── Catalog data ────────────────────────────────────────────────

export const VIKEY_MODEL_CATALOG: ReadonlyArray<VikeyModelDefinition> = [
  // ── Anthropic ─────────────────────────────────────────────────
  {
    id: "claude-3-7-sonnet",
    name: "Claude 3.7 Sonnet (Hybrid Reasoning)",
    category: "anthropic",
    contextWindow: 200000,
    maxTokens: 64000,
    input: ["text", "image"],
    reasoning: true,
    recommended: true,
    description: "Anthropic flagship hybrid model with extended thinking & high coding ability.",
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    category: "anthropic",
    contextWindow: 200000,
    maxTokens: 8192,
    input: ["text", "image"],
    recommended: true,
    description: "Industry-standard high performance coding and reasoning model.",
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    category: "anthropic",
    contextWindow: 200000,
    maxTokens: 8192,
    input: ["text", "image"],
    description: "Fast and lightweight Anthropic model for everyday coding tasks.",
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    category: "anthropic",
    contextWindow: 200000,
    maxTokens: 4096,
    input: ["text", "image"],
    description: "Deep analysis and comprehensive reasoning.",
  },

  // ── DeepSeek ──────────────────────────────────────────────────
  {
    id: "deepseek-reasoner",
    name: "DeepSeek R1 (Reasoner)",
    category: "deepseek",
    contextWindow: 64000,
    maxTokens: 8192,
    input: ["text"],
    reasoning: true,
    recommended: true,
    description: "Open-weights reasoning model with chain-of-thought verification.",
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    category: "deepseek",
    contextWindow: 64000,
    maxTokens: 8192,
    input: ["text"],
    recommended: true,
    description: "High-speed, cost-effective general intelligence and coding model.",
  },

  // ── OpenAI ────────────────────────────────────────────────────
  {
    id: "gpt-4o",
    name: "GPT-4o (Omni)",
    category: "openai",
    contextWindow: 128000,
    maxTokens: 16384,
    input: ["text", "image"],
    recommended: true,
    description: "OpenAI flagship versatile multimodal model.",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    category: "openai",
    contextWindow: 128000,
    maxTokens: 16384,
    input: ["text", "image"],
    description: "Fast, highly economical OpenAI model for everyday assistance.",
  },
  {
    id: "gpt-4.5-preview",
    name: "GPT-4.5 Preview",
    category: "openai",
    contextWindow: 128000,
    maxTokens: 16384,
    input: ["text", "image"],
    description: "Large-scale foundation model for complex creative and technical work.",
  },
  {
    id: "o3-mini",
    name: "OpenAI o3-mini",
    category: "openai",
    contextWindow: 200000,
    maxTokens: 65536,
    input: ["text"],
    reasoning: true,
    description: "Cost-effective reasoning model optimized for math, coding, and STEM.",
  },
  {
    id: "o1",
    name: "OpenAI o1",
    category: "openai",
    contextWindow: 200000,
    maxTokens: 65536,
    input: ["text", "image"],
    reasoning: true,
    description: "Full-scale reasoning model for deep analytical tasks.",
  },

  // ── Google Gemini ─────────────────────────────────────────────
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    category: "google",
    contextWindow: 1048576,
    maxTokens: 8192,
    input: ["text", "image"],
    recommended: true,
    description: "Next-gen multimodal model with 1M context and blazing speed.",
  },
  {
    id: "gemini-2.0-pro-exp-02-05",
    name: "Gemini 2.0 Pro Experimental",
    category: "google",
    contextWindow: 2097152,
    maxTokens: 8192,
    input: ["text", "image"],
    description: "Google flagship experimental model with 2M context.",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    category: "google",
    contextWindow: 2097152,
    maxTokens: 8192,
    input: ["text", "image"],
    description: "Massive 2M context window with high reasoning performance.",
  },

  // ── Open Source & Code Specialists ────────────────────────────
  {
    id: "qwen-2.5-coder-32b-instruct",
    name: "Qwen 2.5 Coder 32B",
    category: "opensource",
    contextWindow: 32768,
    maxTokens: 8192,
    input: ["text"],
    description: "Specialized code generation and bug-fixing model by Alibaba.",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B Instruct",
    category: "opensource",
    contextWindow: 128000,
    maxTokens: 8192,
    input: ["text"],
    description: "Meta state-of-the-art open source LLM.",
  },
];

// ── Lookup helpers ──────────────────────────────────────────────

/** Resolve a catalog entry by model id, or `undefined` when unknown. */
export function getModelById(id: string): VikeyModelDefinition | undefined {
  return VIKEY_MODEL_CATALOG.find((model) => model.id === id);
}

/** Catalog entries grouped by category, preserving catalog order. */
export function getModelsByCategory(
  catalog: ReadonlyArray<VikeyModelDefinition> = VIKEY_MODEL_CATALOG,
): ReadonlyMap<ModelCategory, ReadonlyArray<VikeyModelDefinition>> {
  const groups = new Map<ModelCategory, VikeyModelDefinition[]>();
  for (const model of catalog) {
    const bucket = groups.get(model.category) ?? [];
    bucket.push(model);
    groups.set(model.category, bucket);
  }
  return groups;
}

/** Only the models flagged as recommended. */
export function getRecommendedModels(): ReadonlyArray<VikeyModelDefinition> {
  return VIKEY_MODEL_CATALOG.filter((model) => model.recommended === true);
}