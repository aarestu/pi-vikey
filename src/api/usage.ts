/**
 * Usage & API-key endpoints of the Vikey.ai gateway.
 *
 * Available with a normal API key (`/login vikey`):
 *   GET /v1/api-keys       → API keys with per-key usageCount / usageLimit
 *   GET /v1/api-keys/usage → usage summary of the authenticated key
 *
 * Note: the account *balance* is NOT reachable with an API key — it lives
 * behind the dashboard access token (`https://app.vikey.ai/api/user/billing`).
 *
 * Single responsibility: HTTP + parsing. No presentation, no persistence.
 */

import { VIKEY_DEFAULT_BASE_URL } from "../catalog/catalog.js";
import { maskApiKey } from "../util/mask.js";

/** Aggregated usage counters reported by the gateway. */
export interface UsageSummary {
  readonly totalRequests: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly totalInputTokens: number;
  readonly totalOutputTokens: number;
  readonly totalTokens: number;
  /** Gateway-reported cost (unit follows the dashboard currency, typically IDR). */
  readonly totalCost: number;
}

/** One API key entry, with the raw key masked for display. */
export interface ApiKeyInfo {
  readonly id: string;
  readonly name: string;
  /** Masked form — the raw key is never exposed by this module. */
  readonly maskedKey: string;
  readonly usageCount: number;
  /** `null` means no per-key limit configured. */
  readonly usageLimit: number | null;
  readonly isActive: boolean;
  /** True for the key used to make this request. */
  readonly isCurrent: boolean;
  readonly createdAt?: string;
}

export interface UsageSummaryResult {
  readonly ok: boolean;
  readonly message: string;
  readonly summary: UsageSummary;
  readonly statusCode?: number;
  readonly latencyMs?: number;
}

export interface ApiKeysResult {
  readonly ok: boolean;
  readonly message: string;
  readonly keys: ReadonlyArray<ApiKeyInfo>;
  readonly statusCode?: number;
  readonly latencyMs?: number;
}

export interface UsageRequestOptions {
  /** Override the endpoint (defaults to the public Vikey gateway). */
  readonly baseUrl?: string;
  /** Injectable fetch implementation for tests. */
  readonly fetchImpl?: typeof fetch;
  /** Cooperative cancellation. */
  readonly signal?: AbortSignal;
}

export const EMPTY_USAGE_SUMMARY: UsageSummary = {
  totalRequests: 0,
  successCount: 0,
  errorCount: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalTokens: 0,
  totalCost: 0,
};

/** Fetch the usage summary of the authenticated API key. */
export async function fetchUsageSummary(
  apiKey: string,
  options: UsageRequestOptions = {},
): Promise<UsageSummaryResult> {
  const response = await requestJson("/api-keys/usage", apiKey, options);
  if (!response.ok) {
    return { ok: false, message: response.message, summary: EMPTY_USAGE_SUMMARY, statusCode: response.statusCode, latencyMs: response.latencyMs };
  }
  return {
    ok: true,
    message: `Pemakaian key berhasil diambil (${response.latencyMs}ms).`,
    statusCode: response.statusCode,
    latencyMs: response.latencyMs,
    summary: parseUsageSummary(response.payload),
  };
}

/** List the account's API keys with their usage counters. */
export async function fetchApiKeys(
  apiKey: string,
  options: UsageRequestOptions = {},
): Promise<ApiKeysResult> {
  const response = await requestJson("/api-keys", apiKey, options);
  if (!response.ok) {
    return { ok: false, message: response.message, keys: [], statusCode: response.statusCode, latencyMs: response.latencyMs };
  }
  const keys = parseApiKeys(response.payload, apiKey);
  return {
    ok: true,
    message: `Ditemukan ${keys.length} API key.`,
    statusCode: response.statusCode,
    latencyMs: response.latencyMs,
    keys,
  };
}

// ── Parsing (defensive) ─────────────────────────────────────────

/** Parse the `{ summary: {...} }` envelope, tolerating missing fields. */
export function parseUsageSummary(payload: unknown): UsageSummary {
  const container = isRecord(payload) ? payload.summary : undefined;
  if (!isRecord(container)) return EMPTY_USAGE_SUMMARY;
  return {
    totalRequests: toNumber(container.totalRequests),
    successCount: toNumber(container.successCount),
    errorCount: toNumber(container.errorCount),
    totalInputTokens: toNumber(container.totalInputTokens),
    totalOutputTokens: toNumber(container.totalOutputTokens),
    totalTokens: toNumber(container.totalTokens),
    totalCost: toNumber(container.totalCost),
  };
}

/** Parse the `{ data: [...] }` key list; raw keys are masked immediately. */
export function parseApiKeys(payload: unknown, currentApiKey?: string): Array<ApiKeyInfo> {
  if (!isRecord(payload) || !Array.isArray(payload.data)) return [];
  const keys: Array<ApiKeyInfo> = [];
  for (const entry of payload.data) {
    if (!isRecord(entry) || typeof entry.id !== "string") continue;
    const rawKey = typeof entry.key === "string" ? entry.key : undefined;
    keys.push({
      id: entry.id,
      name: typeof entry.name === "string" && entry.name.length > 0 ? entry.name : "(tanpa nama)",
      maskedKey: rawKey !== undefined ? maskApiKey(rawKey) : "****",
      usageCount: toNumber(entry.usageCount),
      usageLimit: entry.usageLimit === null ? null : toOptionalNumber(entry.usageLimit),
      isActive: entry.isActive === true,
      isCurrent: rawKey !== undefined && rawKey === currentApiKey,
      ...(typeof entry.createdAt === "string" ? { createdAt: entry.createdAt } : {}),
    });
  }
  return keys;
}

// ── HTTP layer ──────────────────────────────────────────────────

interface JsonResponse {
  readonly ok: boolean;
  readonly message: string;
  readonly statusCode?: number;
  readonly latencyMs: number;
  readonly payload?: unknown;
}

async function requestJson(
  path: string,
  apiKey: string,
  options: UsageRequestOptions,
): Promise<JsonResponse> {
  const { baseUrl = VIKEY_DEFAULT_BASE_URL, fetchImpl = fetch, signal } = options;
  const startedAt = Date.now();
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;

  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal,
    });
    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      const body = await safeRead(response);
      return {
        ok: false,
        statusCode: response.status,
        latencyMs,
        message: `Gagal memanggil ${path} (HTTP ${response.status}): ${body || response.statusText}`,
      };
    }

    return { ok: true, latencyMs, statusCode: response.status, message: "ok", payload: await response.json() };
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, latencyMs: Date.now() - startedAt, message: `Koneksi gagal / timeout: ${detail}` };
  }
}

async function safeRead(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toOptionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}