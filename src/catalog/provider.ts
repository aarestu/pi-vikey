/**
 * Builds the pi provider configuration object for Vikey.ai.
 *
 * This is the *single* place that maps the raw catalog (catalog.ts)
 * into the provider shape consumed by both:
 *   - `pi.registerProvider()` at extension load, and
 *   - `~/.pi/agent/models.json`.
 *
 * Keeping this mapping in one module guarantees the extension-provided
 * catalog and the models.json output can never drift apart.
 */

import {
  VIKEY_MODEL_CATALOG,
  VIKEY_DEFAULT_BASE_URL,
  getModelById,
} from "./catalog.js";
import type { ModelInput } from "./types.js";

// Re-export for consumers that import provider constants from this module.
export { VIKEY_DEFAULT_BASE_URL };

/** API flavour used by Vikey.ai (OpenAI-compatible). */
export const VIKEY_API_FLAVOR = "openai-completions" as const;

/** Per-model cost entry (USD per 1M tokens). Zero until real pricing is configured. */
export interface VikeyModelCost {
  readonly input: number;
  readonly output: number;
  readonly cacheRead: number;
  readonly cacheWrite: number;
}

/** Provider model entry shape as written to models.json / registerProvider. */
export interface VikeyProviderModel {
  readonly id: string;
  readonly name: string;
  readonly contextWindow: number;
  readonly maxTokens: number;
  readonly input: Array<ModelInput>;
  readonly reasoning: boolean;
  readonly cost: VikeyModelCost;
  readonly compat?: {
    readonly supportsDeveloperRole?: boolean;
    readonly supportsReasoningEffort?: boolean;
  };
}

/** Full provider config for Vikey.ai. */
export interface VikeyProviderConfig {
  readonly baseUrl: string;
  /** `$ENV_VAR` reference — pi interpolates it at runtime. */
  readonly apiKey: string;
  readonly api: typeof VIKEY_API_FLAVOR;
  readonly models: Array<VikeyProviderModel>;
}

/**
 * Map the immutable catalog into provider model entries.
 *
 * @param apiKeyName env var (or literal) holding the API key; rendered as
 *                   `$NAME` so pi resolves it at request time.
 * @param baseUrl    Vikey.ai endpoint override (defaults to the public gateway).
 */
export function buildProviderConfig(
  apiKeyName = "VIKEY_API_KEY",
  baseUrl = VIKEY_DEFAULT_BASE_URL,
): VikeyProviderConfig {
  return {
    baseUrl,
    apiKey: `$${apiKeyName}`,
    api: VIKEY_API_FLAVOR,
    models: VIKEY_MODEL_CATALOG.map(toProviderModel),
  };
}

/** Conservative limits for remote models missing from the curated catalog. */
export const REMOTE_MODEL_DEFAULT_LIMITS = {
  contextWindow: 128000,
  maxTokens: 16384,
} as const;

/** Models whose id matches this pattern are assumed to be reasoning-capable. */
const REMOTE_REASONING_PATTERN = /(^|\W)(o[134]|r1)(\W|$)|reason|think/i;

/**
 * Map live remote model ids (from `GET /v1/models`) into provider models.
 *
 * Known ids are enriched with curated catalog metadata (context window,
 * modalities, reasoning flag); unknown ids get conservative defaults so new
 * gateway models appear immediately without a local update.
 */
export function buildProviderModelsFromIds(
  ids: ReadonlyArray<string>,
): Array<VikeyProviderModel> {
  const seen = new Set<string>();
  const models: Array<VikeyProviderModel> = [];
  for (const id of ids) {
    if (typeof id !== "string" || id.length === 0 || seen.has(id)) continue;
    seen.add(id);
    models.push(buildRemoteModel(id));
  }
  return models;
}

function buildRemoteModel(id: string): VikeyProviderModel {
  const known = getModelById(id);
  if (known) {
    return toProviderModel(known);
  }
  return {
    id,
    name: id,
    contextWindow: REMOTE_MODEL_DEFAULT_LIMITS.contextWindow,
    maxTokens: REMOTE_MODEL_DEFAULT_LIMITS.maxTokens,
    input: ["text"],
    reasoning: REMOTE_REASONING_PATTERN.test(id),
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  };
}

function toProviderModel(model: (typeof VIKEY_MODEL_CATALOG)[number]): VikeyProviderModel {
  return {
    id: model.id,
    name: model.name,
    contextWindow: model.contextWindow,
    maxTokens: model.maxTokens,
    input: [...model.input],
    reasoning: model.reasoning ?? false,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    ...(model.compat ? { compat: model.compat } : {}),
  };
}