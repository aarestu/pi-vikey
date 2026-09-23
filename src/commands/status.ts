/**
 * `/vikey` handler — extension status summary.
 * Pure function: dependencies are injected, returns a display string.
 */

import { VIKEY_DEFAULT_BASE_URL, VIKEY_MODEL_CATALOG, VIKEY_PROVIDER_ID } from "../catalog/catalog.js";
import { resolveApiKey } from "../config/apiKey.js";
import { getPiModelsJsonPath } from "../config/paths.js";
import { maskApiKey } from "../util/mask.js";

export interface StatusDeps {
  readonly apiKey: string | undefined;
  /** Path shown in the summary (informational). */
  readonly modelsJsonPath?: string;
}

export interface StatusReport {
  readonly hasApiKey: boolean;
  readonly maskedKey: string;
  readonly modelCount: number;
  readonly message: string;
}

/** Build the structured status report (testable without pi). */
export function buildStatusReport(
  deps: StatusDeps = { apiKey: resolveApiKey() },
): StatusReport {
  const hasApiKey = Boolean(deps.apiKey && deps.apiKey.trim().length > 0);
  const maskedKey = maskApiKey(deps.apiKey);
  const modelCount = VIKEY_MODEL_CATALOG.length;
  const modelsJsonPath = deps.modelsJsonPath ?? getPiModelsJsonPath();

  const report: StatusReport = { hasApiKey, maskedKey, modelCount, message: "" };
  return { ...report, message: renderStatusMessage(report, modelsJsonPath) };
}

function renderStatusMessage(report: StatusReport, modelsJsonPath: string): string {
  const keyLine = report.hasApiKey
    ? `✅ Terdeteksi (\`${report.maskedKey}\`)`
    : "⚠️ Belum diatur — jalankan `/login vikey`";

  return [
    "✨ **Vikey.ai Provider Extension for Pi Coding Agent**",
    "",
    `• **Base URL:** \`${VIKEY_DEFAULT_BASE_URL}\``,
    `• **API Key:** ${keyLine}`,
    `• **Model terdaftar:** ${report.modelCount} model (katalog dasar; daftar live via \`/vikey-models\`)`,
    `• **Path models.json:** \`${modelsJsonPath}\``,
    "",
    "**API Key (satu pintu):** jalankan `/login vikey` — tersimpan di `~/.pi/agent/auth.json`",
    "",
    "**Perintah yang tersedia:**",
    "• `/vikey-models` — Daftar model live dari API Vikey.ai",
    "• `/vikey-test`   — Menguji koneksi & latensi ke server Vikey.ai",
    "• `/vikey-setup`  — Otomatis sinkronisasi model ke models.json",
    "",
    "**Contoh penggunaan model langsung:**",
    `• \`pi --model ${VIKEY_PROVIDER_ID}/claude-3-7-sonnet\``,
    `• \`pi --model ${VIKEY_PROVIDER_ID}/deepseek-reasoner\``,
    `• \`pi --model ${VIKEY_PROVIDER_ID}/gpt-4o\``,
  ].join("\n");
}