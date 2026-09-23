/**
 * Pi Coding Agent Extension — Vikey.ai Provider (composition root).
 *
 * Responsibilities kept to wiring only:
 *   - register the provider (catalog/provider.ts builds the config)
 *   - register commands (commands/register.ts owns pi's command API)
 *   - surface a one-line session-start notification
 *
 * Project layout (modular, single-responsibility):
 *   catalog/   model data, provider config mapping, markdown formatting
 *   config/    api-key resolution, path resolution, models.json persistence
 *   api/       HTTP client for the Vikey.ai gateway
 *   commands/  pure command handlers + pi registration
 *   cli/       standalone setup/test CLIs
 *   bin/       `pi-vikey` executable
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { VIKEY_PROVIDER_ID, VIKEY_PROVIDER_NAME } from "./catalog/catalog.js";
import { VIKEY_DEFAULT_BASE_URL, buildProviderConfig } from "./catalog/provider.js";
import { refreshVikeyModels } from "./api/refresh.js";
import { registerVikeyCommands } from "./commands/register.js";
import { hasApiKey } from "./config/apiKey.js";

export default function (pi: ExtensionAPI): void {
  // 1. Provider registration — config object built from the single catalog.
  //    refreshModels keeps the /model list in sync with the live Vikey.ai API:
  //    the list is fetched from the gateway and persisted for offline reuse;
  //    the static catalog only remains as a fallback.
  pi.registerProvider(VIKEY_PROVIDER_ID, {
    name: VIKEY_PROVIDER_NAME,
    ...buildProviderConfig(),
    refreshModels: (context) => refreshVikeyModels(context, { baseUrl: VIKEY_DEFAULT_BASE_URL }),
  });

  // 2. Interactive commands (/vikey, /vikey-models, /vikey-test, /vikey-setup).
  registerVikeyCommands(pi);

  // 3. Startup hint — point at `/login vikey` when no credential exists yet.
  pi.on("session_start", async (_event, ctx) => {
    if (hasApiKey()) {
      ctx.ui.notify("🔌 Vikey.ai provider ready — use /vikey for info", "info");
      return;
    }
    try {
      const auth = await ctx.modelRegistry.getProviderAuth(VIKEY_PROVIDER_ID);
      if (auth?.auth.apiKey) {
        ctx.ui.notify("🔌 Vikey.ai provider ready — use /vikey for info", "info");
        return;
      }
    } catch {
      // Auth resolution unavailable — show the login hint below.
    }
    ctx.ui.notify("🔌 Vikey.ai: run /login vikey to set your API key", "info");
  });
}