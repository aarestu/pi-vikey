/**
 * Read/write/merge operations on pi's `models.json` files.
 * This module owns ALL filesystem interaction with models.json —
 * commands and CLIs use it instead of touching fs directly.
 */

import * as fs from "node:fs";
import * as path from "node:path";

/** Shape of a pi models.json file (only the parts we care about). */
export interface ModelsJsonDoc {
  providers?: Record<string, unknown>;
}

/** Result of an upsert operation — recoverable errors are typed, not thrown. */
export interface UpsertResult {
  readonly success: boolean;
  readonly filePath: string;
  readonly message: string;
  /** Count of models written (set when successful). */
  readonly modelCount?: number;
}

/** Read and parse a models.json, tolerating missing/corrupt files. */
export function readModelsJson(filePath: string): ModelsJsonDoc {
  if (!fs.existsSync(filePath)) {
    return { providers: {} };
  }
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return isModelsJsonDoc(parsed) ? parsed : { providers: {} };
  } catch {
    // Corrupt JSON: start from a clean document rather than crashing.
    return { providers: {} };
  }
}

/** Persist a models.json document, creating parent directories as needed. */
export function writeModelsJson(filePath: string, doc: ModelsJsonDoc): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2), "utf-8");
}

/**
 * Merge a provider config into models.json under `providers[providerId]`,
 * preserving all other providers already present.
 */
export function upsertProvider(
  filePath: string,
  providerId: string,
  providerConfig: unknown,
): UpsertResult {
  try {
    const doc = readModelsJson(filePath);
    const providers = doc.providers ?? {};
    providers[providerId] = providerConfig;
    writeModelsJson(filePath, { ...doc, providers });

    const modelCount =
      isRecord(providerConfig) && Array.isArray(providerConfig.models)
        ? providerConfig.models.length
        : 0;

    return {
      success: true,
      filePath,
      modelCount,
      message: `Konfigurasi provider "${providerId}" berhasil disimpan ke: ${filePath}`,
    };
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      filePath,
      message: `Gagal menulis ke ${filePath}: ${detail}`,
    };
  }
}

function isModelsJsonDoc(value: unknown): value is ModelsJsonDoc {
  return isRecord(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}