/**
 * `/vikey-models` handler — renders the model list.
 *
 * The list is fetched live from the Vikey.ai API when a key is configured;
 * the curated static catalog is only a fallback (offline / fetch failure).
 */

import { buildProviderModelsFromIds } from "../catalog/provider.js";
import { formatModelsListMarkdown, formatRemoteModelsMarkdown } from "../catalog/format.js";
import { fetchRemoteModelIds } from "../api/models-fetch.js";
import { resolveApiKey } from "../config/apiKey.js";

export interface ModelsCommandDeps {
  /** API key for the live fetch (defaults to env resolution). */
  readonly apiKey?: string;
  /** Injectable remote fetch for tests. */
  readonly fetchModels?: typeof fetchRemoteModelIds;
}

/** Build the markdown model list (live from the API when possible). */
export async function buildModelsMessage(deps: ModelsCommandDeps = {}): Promise<string> {
  const apiKey = deps.apiKey ?? resolveApiKey();

  if (apiKey) {
    const result = await (deps.fetchModels ?? fetchRemoteModelIds)(apiKey);
    if (result.ok && result.modelIds.length > 0) {
      return formatRemoteModelsMarkdown(buildProviderModelsFromIds(result.modelIds));
    }
  }

  // Fallback: curated static catalog (no key, offline, or gateway error).
  return formatModelsListMarkdown();
}