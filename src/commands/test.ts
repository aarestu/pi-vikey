/**
 * `/vikey-test` handler — reports gateway connectivity.
 * The network client is injected so this stays unit-testable.
 */

import type { VikeyTestResult } from "../api/client.js";
import { testVikeyConnection } from "../api/client.js";
import { resolveApiKey } from "../config/apiKey.js";
import type { TestConnectionOptions } from "../api/client.js";

export interface TestCommandDeps {
  /** API key to test with (defaults to env resolution). */
  readonly apiKey?: string;
  /** Connection options forwarded to the client. */
  readonly options?: TestConnectionOptions;
  /** Injectable client for tests. */
  readonly testConnection?: typeof testVikeyConnection;
}

export interface TestCommandReport {
  readonly result: VikeyTestResult | null;
  readonly message: string;
}

/** Run the connection test and render a human-readable result. */
export async function buildTestCommand(
  deps: TestCommandDeps = {},
): Promise<TestCommandReport> {
  const apiKey = deps.apiKey ?? resolveApiKey();

  if (!apiKey) {
    return {
      result: null,
      message:
        "⚠️ API Key Vikey belum diatur. Jalankan `/login vikey` untuk menyimpan API key.",
    };
  }

  const run = deps.testConnection ?? testVikeyConnection;
  const result = await run(apiKey, deps.options);

  if (result.ok) {
    return {
      result,
      message:
        `✅ **Koneksi Sukses!**\n` +
        `Latensi: \`${result.latencyMs}ms\`\n` +
        `Model remote ditemukan: ${result.modelsFound?.length ?? 0}\n` +
        `Pesan: ${result.message}`,
    };
  }

  return { result, message: `❌ **Koneksi Gagal!**\n${result.message}` };
}