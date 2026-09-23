/**
 * Wires the pure command modules to pi's command API.
 * This is the only place that knows about `pi.registerCommand`.
 *
 * API key resolution follows pi's canonical chain: the stored credential
 * from `/login vikey` (via modelRegistry) wins; env vars are only a fallback.
 */

import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { VIKEY_PROVIDER_ID } from "../catalog/catalog.js";
import { getPiModelsJsonPath } from "../config/paths.js";
import { resolveApiKey, resolveStoredApiKey } from "../config/apiKey.js";
import { buildStatusReport } from "./status.js";
import { buildModelsMessage } from "./list.js";
import { buildTestCommand } from "./test.js";
import { runSetupCommand } from "./setup.js";

/**
 * Effective API key inside a pi session:
 * 1. stored credential from `/login vikey` (via pi's auth resolution)
 * 2. `~/.pi/agent/auth.json` read directly
 * 3. environment variables
 */
async function resolveContextApiKey(ctx: ExtensionCommandContext): Promise<string | undefined> {
  try {
    const auth = await ctx.modelRegistry.getProviderAuth(VIKEY_PROVIDER_ID);
    if (auth?.auth.apiKey) return auth.auth.apiKey;
  } catch {
    // Auth resolution unavailable — fall through to file/env lookup.
  }
  return resolveStoredApiKey() ?? resolveApiKey();
}

/** Register all `/vikey*` commands on the pi instance. */
export function registerVikeyCommands(pi: ExtensionAPI): void {
  pi.registerCommand("vikey", {
    description: "Menampilkan status koneksi dan informasi ekstensi Vikey.ai",
    handler: async (_args, ctx) => {
      const { message } = buildStatusReport({
        apiKey: await resolveContextApiKey(ctx),
        modelsJsonPath: getPiModelsJsonPath(),
      });
      ctx.ui.notify(message, "info");
    },
  });

  pi.registerCommand("vikey-models", {
    description: "Menampilkan daftar model Vikey.ai (live dari API)",
    handler: async (_args, ctx) => {
      const message = await buildModelsMessage({ apiKey: await resolveContextApiKey(ctx) });
      ctx.ui.notify(message, "info");
    },
  });

  pi.registerCommand("vikey-test", {
    description: "Menguji koneksi API ke server Vikey.ai",
    handler: async (_args, ctx) => {
      const { message } = await buildTestCommand({ apiKey: await resolveContextApiKey(ctx) });
      ctx.ui.notify(message, "info");
    },
  });

  pi.registerCommand("vikey-setup", {
    description: "Otomatis mendaftarkan provider Vikey.ai ke models.json",
    handler: async (_args, ctx) => {
      const { message } = runSetupCommand({ filePath: getPiModelsJsonPath() });
      ctx.ui.notify(message, "info");
    },
  });
}