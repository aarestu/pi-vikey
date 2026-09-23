import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAuthJsonPath,
  hasApiKey,
  resolveApiKey,
  resolveEffectiveApiKey,
  resolveStoredApiKey,
} from "../../../src/config/apiKey.ts";

const ORIGINAL = {
  VIKEY: process.env.VIKEY_API_KEY,
  OPENAI: process.env.OPENAI_API_KEY,
};

afterEach(() => {
  if (ORIGINAL.VIKEY === undefined) delete process.env.VIKEY_API_KEY;
  else process.env.VIKEY_API_KEY = ORIGINAL.VIKEY;
  if (ORIGINAL.OPENAI === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = ORIGINAL.OPENAI;
  vi.unstubAllEnvs();
});

/** Create a fake home with a `/login vikey` style auth.json. */
function withStoredKey(credential: unknown): string {
  const homedir = fs.mkdtempSync(path.join(os.tmpdir(), "vikey-auth-"));
  const authDir = path.join(homedir, ".pi", "agent");
  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(path.join(authDir, "auth.json"), JSON.stringify({ vikey: credential }));
  return homedir;
}

function emptyHome(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "vikey-empty-"));
}

describe("resolveApiKey (env fallback)", () => {
  it("prefers an explicit key over the environment", () => {
    vi.stubEnv("VIKEY_API_KEY", "from-env");
    expect(resolveApiKey("explicit")).toBe("explicit");
  });

  it("returns undefined when nothing is configured", () => {
    expect(resolveApiKey()).toBeUndefined();
  });

  it("reads VIKEY_API_KEY when set", () => {
    vi.stubEnv("VIKEY_API_KEY", "sk-vikey-123");
    expect(resolveApiKey()).toBe("sk-vikey-123");
  });

  it("falls back to OPENAI_API_KEY when VIKEY_API_KEY is absent", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-openai-456");
    expect(resolveApiKey()).toBe("sk-openai-456");
  });

  it("prefers VIKEY_API_KEY over OPENAI_API_KEY", () => {
    vi.stubEnv("VIKEY_API_KEY", "sk-vikey-1");
    vi.stubEnv("OPENAI_API_KEY", "sk-openai-2");
    expect(resolveApiKey()).toBe("sk-vikey-1");
  });

  it("ignores blank direct values and whitespace-only env values", () => {
    vi.stubEnv("VIKEY_API_KEY", "   ");
    expect(resolveApiKey("  ")).toBeUndefined();
  });
});

describe("resolveStoredApiKey (/login vikey credential)", () => {
  it("reads the key stored in auth.json", () => {
    const homedir = withStoredKey({ type: "api_key", key: "vk-stored-key-1" });

    expect(resolveStoredApiKey(homedir)).toBe("vk-stored-key-1");
    expect(getAuthJsonPath(homedir)).toBe(path.join(homedir, ".pi", "agent", "auth.json"));
    fs.rmSync(homedir, { recursive: true, force: true });
  });

  it("returns undefined for missing or corrupt auth.json", () => {
    const empty = emptyHome();
    expect(resolveStoredApiKey(empty)).toBeUndefined();

    const corrupt = emptyHome();
    const authDir = path.join(corrupt, ".pi", "agent");
    fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(path.join(authDir, "auth.json"), "{ corrupt");
    expect(resolveStoredApiKey(corrupt)).toBeUndefined();

    fs.rmSync(empty, { recursive: true, force: true });
    fs.rmSync(corrupt, { recursive: true, force: true });
  });

  it("ignores non-api_key credentials and blank keys", () => {
    const oauthHome = withStoredKey({ type: "oauth", access: "token" });
    expect(resolveStoredApiKey(oauthHome)).toBeUndefined();

    const blankHome = withStoredKey({ type: "api_key", key: "   " });
    expect(resolveStoredApiKey(blankHome)).toBeUndefined();

    fs.rmSync(oauthHome, { recursive: true, force: true });
    fs.rmSync(blankHome, { recursive: true, force: true });
  });
});

describe("resolveEffectiveApiKey (single-door /login vikey)", () => {
  it("prefers the stored credential over env", () => {
    const homedir = withStoredKey({ type: "api_key", key: "vk-stored-key-1" });
    vi.stubEnv("VIKEY_API_KEY", "sk-from-env");

    expect(resolveEffectiveApiKey(homedir)).toBe("vk-stored-key-1");
    fs.rmSync(homedir, { recursive: true, force: true });
  });

  it("falls back to env when no credential is stored", () => {
    const homedir = emptyHome();
    vi.stubEnv("VIKEY_API_KEY", "sk-from-env");

    expect(resolveEffectiveApiKey(homedir)).toBe("sk-from-env");
    fs.rmSync(homedir, { recursive: true, force: true });
  });

  it("returns undefined when neither source is configured", () => {
    const homedir = emptyHome();
    expect(resolveEffectiveApiKey(homedir)).toBeUndefined();
    fs.rmSync(homedir, { recursive: true, force: true });
  });
});

describe("hasApiKey", () => {
  it("is false without any key source", () => {
    const homedir = emptyHome();
    expect(hasApiKey(homedir)).toBe(false);
    fs.rmSync(homedir, { recursive: true, force: true });
  });

  it("is true with an env key", () => {
    vi.stubEnv("VIKEY_API_KEY", "sk-vikey-123");
    const homedir = emptyHome();
    expect(hasApiKey(homedir)).toBe(true);
    fs.rmSync(homedir, { recursive: true, force: true });
  });

  it("is true with only a stored /login credential", () => {
    const homedir = withStoredKey({ type: "api_key", key: "vk-stored-key-1" });
    expect(hasApiKey(homedir)).toBe(true);
    fs.rmSync(homedir, { recursive: true, force: true });
  });
});