/**
 * Standalone connection-test CLI
 * (`node dist/cli/test-connection.js` / npm run test:conn).
 */

import { resolveEffectiveApiKey } from "../config/apiKey.js";
import { testVikeyConnection } from "../api/client.js";
import { maskApiKey } from "../util/mask.js";

/** Run the connection test; returns a process exit code. */
export async function runTestCli(): Promise<number> {
  // Primary: credential stored by `/login vikey`; fallback: env vars.
  const apiKey = resolveEffectiveApiKey();

  if (!apiKey) {
    console.error("❌ API Key Vikey belum diatur.");
    console.error("");
    console.error("Cara utama: jalankan `pi`, lalu ketik /login vikey");
    console.error("  (kredensial tersimpan di ~/.pi/agent/auth.json)");
    console.error("");
    console.error("Alternatif (headless/CI): set environment variable VIKEY_API_KEY");
    process.exitCode = 1;
    return 1;
  }

  console.log("🔌 Testing koneksi ke Vikey.ai...");
  console.log(`   API Key:  ${maskApiKey(apiKey)}`);
  console.log("");

  const result = await testVikeyConnection(apiKey);

  if (result.ok) {
    console.log(`✅ Koneksi sukses! (${result.latencyMs}ms)\n`);
    console.log(`📋 Model remote tersedia (${result.modelsFound?.length ?? 0}):`);
    for (const id of result.modelsFound?.slice(0, 20) ?? []) {
      console.log(`   • ${id}`);
    }
    if ((result.modelsFound?.length ?? 0) > 20) {
      console.log(`   ... dan ${result.modelsFound!.length - 20} lainnya`);
    }
    console.log("\n✨ Vikey.ai siap digunakan dengan Pi Coding Agent!");
    return 0;
  }

  console.error(`❌ Koneksi gagal: ${result.message}`);
  return 1;
}

// Direct-execution guard.
const isDirectRun =
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href;

if (isDirectRun) {
  runTestCli().then(
    (code) => {
      process.exitCode = code;
    },
    (err: unknown) => {
      console.error("❌ Error tak terduga:", err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
    },
  );
}