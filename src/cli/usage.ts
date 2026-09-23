/**
 * Standalone usage CLI (`node dist/cli/usage.js` / `pi-vikey usage`).
 * Uses the `/login vikey` credential, with env fallback.
 */

import { fetchApiKeys, fetchUsageSummary } from "../api/usage.js";
import { formatUsageMessage } from "../catalog/format.js";
import { resolveEffectiveApiKey } from "../config/apiKey.js";

/** Print the usage report; returns a process exit code. */
export async function runUsageCli(): Promise<number> {
  const apiKey = resolveEffectiveApiKey();

  if (!apiKey) {
    console.error("❌ API Key Vikey belum diatur.");
    console.error("Cara utama: jalankan `pi`, lalu ketik /login vikey");
    process.exitCode = 1;
    return 1;
  }

  const [usage, keys] = await Promise.all([
    fetchUsageSummary(apiKey),
    fetchApiKeys(apiKey),
  ]);

  if (!usage.ok) {
    console.error(`❌ Gagal mengambil pemakaian: ${usage.message}`);
    return 1;
  }

  console.log(formatUsageMessage(usage.summary, keys.ok ? keys.keys : []));
  if (!keys.ok) {
    console.warn(`\n⚠️ Daftar API key gagal dimuat: ${keys.message}`);
  }
  return 0;
}

// Direct-execution guard. Sets `exitCode` instead of calling `process.exit()`
// so pending network handles can close cleanly (avoids a libuv assert on Windows).
const isDirectRun =
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href;

if (isDirectRun) {
  runUsageCli().then(
    (code) => {
      process.exitCode = code;
    },
    (err: unknown) => {
      console.error("❌ Error tak terduga:", err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
    },
  );
}