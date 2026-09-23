/**
 * Live model-list refresh for the Vikey provider, following pi's
 * `refreshModels` contract (see docs/extensions.md):
 *
 *   - Offline phase (pi startup, `--list-models`): restore the persisted
 *     snapshot (`context.stored`) so the list matches the last API fetch.
 *   - Network phase (TUI startup, `/model`, `/login`): fetch `GET /v1/models`
 *     live, enrich ids with catalog metadata, publish the new list and persist
 *     a snapshot for later offline use.
 *   - Fallback: the curated static catalog, so the provider never ends up
 *     with an empty or stale-broken list.
 */

import type { Api, Model, RefreshModelsContext } from "@earendil-works/pi-ai";
import type { ProviderModelConfig } from "@earendil-works/pi-coding-agent";
import { VIKEY_PROVIDER_ID } from "../catalog/catalog.js";
import {
  VIKEY_API_FLAVOR,
  VIKEY_DEFAULT_BASE_URL,
  buildProviderConfig,
  buildProviderModelsFromIds,
} from "../catalog/provider.js";
import type { VikeyProviderModel } from "../catalog/provider.js";
import { fetchRemoteModelIds } from "./models-fetch.js";

export interface RefreshDeps {
  /** Injectable remote fetch for tests. */
  readonly fetchModels?: typeof fetchRemoteModelIds;
  /** Injectable id→model mapping for tests. */
  readonly buildModels?: typeof buildProviderModelsFromIds;
  /** Injectable clock for the persisted snapshot timestamp. */
  readonly now?: () => number;
  /** Gateway base URL to fetch from (defaults to the public Vikey endpoint). */
  readonly baseUrl?: string;
}

/** Baseline fallback: the curated static catalog, always non-empty. */
function baselineModels(): Array<VikeyProviderModel> {
  return buildProviderConfig().models;
}

/** Extract the effective API key from the refresh credential. */
function getCredentialKey(context: RefreshModelsContext): string | undefined {
  const { credential } = context;
  return credential?.type === "api_key" ? credential.key : undefined;
}

/** Persisted snapshot → provider model config (strip runtime-only fields). */
function toProviderConfigs(models: ReadonlyArray<Model<Api>>): Array<ProviderModelConfig> {
  return models.map((model) => {
    const { api: _api, provider: _provider, baseUrl: _baseUrl, ...config } = model;
    return config;
  });
}

/** Provider model config → full `Model` shape required for persistence. */
function toPersistableModels(
  models: ReadonlyArray<VikeyProviderModel>,
): Array<Model<Api>> {
  return models.map((model) => ({
    id: model.id,
    name: model.name,
    api: VIKEY_API_FLAVOR,
    provider: VIKEY_PROVIDER_ID,
    baseUrl: VIKEY_DEFAULT_BASE_URL,
    reasoning: model.reasoning,
    input: [...model.input],
    cost: { ...model.cost },
    contextWindow: model.contextWindow,
    maxTokens: model.maxTokens,
    ...(model.compat ? { compat: model.compat } : {}),
  }));
}

/**
 * `refreshModels` implementation for the vikey provider.
 * Returns the effective model list; never returns an empty array.
 */
export async function refreshVikeyModels(
  context: RefreshModelsContext,
  deps: RefreshDeps = {},
): Promise<Array<ProviderModelConfig>> {
  const fetchModels = deps.fetchModels ?? fetchRemoteModelIds;
  const buildModels = deps.buildModels ?? buildProviderModelsFromIds;
  const now = deps.now ?? Date.now;

  const storedModels = context.stored?.models;
  const storedConfigs =
    storedModels && storedModels.length > 0 ? toProviderConfigs(storedModels) : undefined;
  const fallback = storedConfigs ?? baselineModels();

  // Offline phase: serve the last persisted snapshot (fresh from the API).
  if (!context.allowNetwork) {
    return fallback;
  }

  // Network phase: needs a resolved credential.
  const apiKey = getCredentialKey(context);
  if (!apiKey) {
    return fallback;
  }

  const result = await fetchModels(apiKey, { signal: context.signal, baseUrl: deps.baseUrl });
  if (!result.ok || result.modelIds.length === 0) {
    // Keep the last known list on failure — never blank the provider.
    return fallback;
  }

  const models = buildModels(result.modelIds);
  await context.publish({
    persist: { models: toPersistableModels(models), checkedAt: now() },
  });
  return models;
}