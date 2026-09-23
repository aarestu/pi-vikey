/**
 * API key resolution.
 *
 * Primary entry point: `/login vikey` — pi stores the credential in
 * `~/.pi/agent/auth.json`; `resolveStoredApiKey` reads it back.
 * Environment variables remain a secondary fallback for headless/CI use.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { VIKEY_PROVIDER_ID } from "../catalog/catalog.js";

/**
 * Resolve the Vikey API key from a direct value or the environment.
 *
 * @param directKey   explicit key (e.g. from CLI) — wins over env
 * @returns the trimmed key, or `undefined` when nothing is configured
 */
export function resolveApiKey(directKey?: string): string | undefined {
  if (directKey !== undefined && directKey.trim().length > 0) {
    return directKey.trim();
  }
  const fromEnv = process.env.VIKEY_API_KEY || process.env.OPENAI_API_KEY;
  return fromEnv !== undefined && fromEnv.trim().length > 0 ? fromEnv.trim() : undefined;
}

/** Path to pi's credential store: `~/.pi/agent/auth.json`. */
export function getAuthJsonPath(homedir: string = os.homedir()): string {
  return path.join(homedir, ".pi", "agent", "auth.json");
}

/**
 * Read the API key stored by `/login vikey` from `~/.pi/agent/auth.json`.
 * Tolerates missing/corrupt files; never throws.
 */
export function resolveStoredApiKey(homedir: string = os.homedir()): string | undefined {
  try {
    const filePath = getAuthJsonPath(homedir);
    if (!fs.existsSync(filePath)) return undefined;
    const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (!isRecord(parsed)) return undefined;
    const credential = parsed[VIKEY_PROVIDER_ID];
    if (!isRecord(credential) || credential.type !== "api_key") return undefined;
    const key = credential.key;
    return typeof key === "string" && key.trim().length > 0 ? key.trim() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Effective key for CLI tools: stored credential (`/login vikey`) first,
 * then environment variables.
 */
export function resolveEffectiveApiKey(homedir: string = os.homedir()): string | undefined {
  return resolveStoredApiKey(homedir) ?? resolveApiKey();
}

/** Whether any usable API key is currently configured (stored or env). */
export function hasApiKey(homedir: string = os.homedir()): boolean {
  return (resolveStoredApiKey(homedir) ?? resolveApiKey()) !== undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}