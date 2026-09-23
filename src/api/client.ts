/**
 * Thin HTTP client for the Vikey.ai OpenAI-compatible endpoint.
 * Single responsibility: talk to the API and report structured results.
 *
 * `fetchImpl` is injectable so tests can stub the network layer.
 */

import { VIKEY_DEFAULT_BASE_URL } from "../catalog/catalog.js";
import { extractModelIds } from "./models-fetch.js";

/** Structured result of a connection test — errors are values, not throws. */
export interface VikeyTestResult {
  readonly ok: boolean;
  readonly message: string;
  readonly statusCode?: number;
  /** Remote model ids returned by the gateway. */
  readonly modelsFound?: ReadonlyArray<string>;
  readonly latencyMs?: number;
}

export interface TestConnectionOptions {
  /** Override the endpoint (defaults to the public Vikey gateway). */
  readonly baseUrl?: string;
  /** Injectable fetch implementation for tests. */
  readonly fetchImpl?: typeof fetch;
}

/** Validate an API key format before hitting the network. */
export function isValidApiKeyFormat(key: string): boolean {
  return key.trim().length >= 8;
}

/**
 * Probe the live gateway: `GET /models` with a Bearer token.
 * Reports structured results; never throws.
 */
export async function testVikeyConnection(
  apiKey: string,
  options: TestConnectionOptions = {},
): Promise<VikeyTestResult> {
  const { baseUrl = VIKEY_DEFAULT_BASE_URL, fetchImpl = fetch } = options;

  if (!isValidApiKeyFormat(apiKey)) {
    return {
      ok: false,
      message: "Format API Key tidak valid (minimal 8 karakter).",
    };
  }

  const startedAt = Date.now();
  const url = `${baseUrl.replace(/\/+$/, "")}/models`;

  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      const body = await safeRead(response);
      return {
        ok: false,
        statusCode: response.status,
        latencyMs,
        message: `Gagal menghubungkan ke Vikey.ai (HTTP ${response.status}): ${body || response.statusText}`,
      };
    }

    const payload: unknown = await response.json();
    const modelsFound = extractModelIds(payload);
    return {
      ok: true,
      statusCode: response.status,
      latencyMs,
      modelsFound,
      message: `Berhasil terhubung ke Vikey.ai dalam ${latencyMs}ms! Ditemukan ${modelsFound.length} model remote.`,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startedAt;
    const detail = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      latencyMs,
      message: `Koneksi gagal / timeout: ${detail}`,
    };
  }
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