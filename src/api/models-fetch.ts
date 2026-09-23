/**
 * Fetches the live model catalog from the Vikey.ai gateway
 * (`GET /v1/models`). Single responsibility: network access +
 * response parsing — no mapping, no persistence.
 */

import { VIKEY_DEFAULT_BASE_URL } from "../catalog/catalog.js";

/** Structured fetch result — network errors are values, not throws. */
export interface RemoteModelsResult {
  readonly ok: boolean;
  /** Remote model ids in gateway order (deduplicated). */
  readonly modelIds: ReadonlyArray<string>;
  readonly statusCode?: number;
  readonly latencyMs?: number;
  readonly message: string;
}

export interface FetchRemoteModelsOptions {
  /** Override the endpoint (defaults to the public Vikey gateway). */
  readonly baseUrl?: string;
  /** Injectable fetch implementation for tests. */
  readonly fetchImpl?: typeof fetch;
  /** Cooperative cancellation (wired to pi's refresh signal). */
  readonly signal?: AbortSignal;
}

/**
 * Extract model ids from an OpenAI-compatible `/models` payload.
 * Exported for reuse; tolerates unexpected shapes.
 */
export function extractModelIds(payload: unknown): string[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) return [];
  return payload.data
    .filter((entry): entry is ModelIdEntry => isRecord(entry) && typeof entry.id === "string")
    .map((entry) => entry.id);
}

interface ModelIdEntry {
  readonly id: string;
}

/**
 * Fetch the live model id list from the gateway.
 * Never throws; inspect the returned result instead.
 */
export async function fetchRemoteModelIds(
  apiKey: string,
  options: FetchRemoteModelsOptions = {},
): Promise<RemoteModelsResult> {
  const { baseUrl = VIKEY_DEFAULT_BASE_URL, fetchImpl = fetch, signal } = options;

  const startedAt = Date.now();
  const url = `${baseUrl.replace(/\/+$/, "")}/models`;

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
        modelIds: [],
        statusCode: response.status,
        latencyMs,
        message: `Gagal mengambil daftar model (HTTP ${response.status}): ${body || response.statusText}`,
      };
    }

    const payload: unknown = await response.json();
    const modelIds = dedupe(extractModelIds(payload));
    return {
      ok: true,
      modelIds,
      statusCode: response.status,
      latencyMs,
      message: `Berhasil mengambil ${modelIds.length} model dari Vikey.ai dalam ${latencyMs}ms.`,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startedAt;
    const detail = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      modelIds: [],
      latencyMs,
      message: `Koneksi gagal / timeout: ${detail}`,
    };
  }
}

function dedupe(ids: ReadonlyArray<string>): string[] {
  return [...new Set(ids)];
}

async function safeRead(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}