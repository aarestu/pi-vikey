/**
 * `/vikey-usage` handler — pemakaian & biaya API key Vikey.ai.
 *
 * Uses only endpoints reachable with an API key:
 *   GET /v1/api-keys/usage  → usage summary of the authenticated key
 *   GET /v1/api-keys        → account keys with usageCount / usageLimit
 *
 * Account balance is intentionally out of scope: it requires the dashboard
 * access token, not an API key.
 */

import {
  fetchApiKeys,
  fetchUsageSummary,
  EMPTY_USAGE_SUMMARY,
} from "../api/usage.js";
import type { ApiKeyInfo, UsageSummary } from "../api/usage.js";
import { formatUsageMessage } from "../catalog/format.js";

export interface UsageCommandDeps {
  /** API key to query with (defaults to the caller's resolved key). */
  readonly apiKey?: string;
  /** Injectable fetchers for tests. */
  readonly fetchUsage?: typeof fetchUsageSummary;
  readonly fetchKeys?: typeof fetchApiKeys;
}

export interface UsageCommandReport {
  readonly usage: UsageSummary;
  readonly keys: ReadonlyArray<ApiKeyInfo>;
  readonly message: string;
}

/** Collect usage + key list and render the report. */
export async function buildUsageCommand(
  deps: UsageCommandDeps = {},
): Promise<UsageCommandReport> {
  const apiKey = deps.apiKey;
  if (!apiKey) {
    return {
      usage: EMPTY_USAGE_SUMMARY,
      keys: [],
      message:
        "⚠️ API Key Vikey belum diatur. Jalankan `/login vikey` untuk menyimpan API key.",
    };
  }

  const loadUsage = deps.fetchUsage ?? fetchUsageSummary;
  const loadKeys = deps.fetchKeys ?? fetchApiKeys;

  const [usageResult, keysResult] = await Promise.all([
    loadUsage(apiKey),
    loadKeys(apiKey),
  ]);

  if (!usageResult.ok) {
    return {
      usage: EMPTY_USAGE_SUMMARY,
      keys: keysResult.keys,
      message: `❌ Gagal mengambil pemakaian Vikey.ai.\n${usageResult.message}`,
    };
  }

  const keys = keysResult.ok ? keysResult.keys : [];
  const warnings = keysResult.ok
    ? ""
    : `\n\n> ⚠️ Daftar API key gagal dimuat: ${keysResult.message}`;

  return {
    usage: usageResult.summary,
    keys,
    message: `${formatUsageMessage(usageResult.summary, keys)}${warnings}`,
  };
}