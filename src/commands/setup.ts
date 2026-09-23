/**
 * `/vikey-setup` handler — writes the provider config into models.json.
 * The persistence layer is injected so this stays unit-testable.
 */

import { buildProviderConfig } from "../catalog/provider.js";
import { VIKEY_DEFAULT_BASE_URL, VIKEY_PROVIDER_ID } from "../catalog/catalog.js";
import { upsertProvider } from "../config/modelsJson.js";
import type { UpsertResult } from "../config/modelsJson.js";

export interface SetupCommandDeps {
  /** Target models.json path (defaults to the global pi path). */
  readonly filePath: string;
  /** Injectable persistence layer for tests. */
  readonly upsert?: typeof upsertProvider;
}

export interface SetupCommandReport {
  readonly result: UpsertResult;
  readonly message: string;
}

/** Register the Vikey provider into a models.json and render the outcome. */
export function runSetupCommand(
  deps: SetupCommandDeps,
): SetupCommandReport {
  const upsert = deps.upsert ?? upsertProvider;
  const providerConfig = buildProviderConfig("VIKEY_API_KEY", VIKEY_DEFAULT_BASE_URL);
  const result = upsert(deps.filePath, VIKEY_PROVIDER_ID, providerConfig);

  if (result.success) {
    return {
      result,
      message:
        `✅ ${result.message}\n` +
        `Sekarang restart Pi atau ketik \`/reload\` untuk memuat model Vikey.ai.\n` +
        `Kemudian pilih model melalui menu \`/model\` Pi.`,
    };
  }

  return { result, message: `❌ ${result.message}` };
}