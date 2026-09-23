import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  upsertProvider,
  readModelsJson,
  writeModelsJson,
} from "../../../src/config/modelsJson.ts";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vikey-modelsjson-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function targetPath(name = "models.json"): string {
  return path.join(tmpDir, name);
}

const SAMPLE_PROVIDER = {
  baseUrl: "https://api.vikey.ai/v1",
  apiKey: "$VIKEY_API_KEY",
  api: "openai-completions",
  models: [{ id: "gpt-4o" }, { id: "claude-3-7-sonnet" }],
};

describe("upsertProvider", () => {
  it("creates the file and registers the provider", () => {
    const filePath = targetPath();
    const result = upsertProvider(filePath, "vikey", SAMPLE_PROVIDER);

    expect(result.success).toBe(true);
    expect(result.modelCount).toBe(2);
    expect(fs.existsSync(filePath)).toBe(true);

    const doc = readModelsJson(filePath);
    expect(doc.providers?.vikey).toEqual(SAMPLE_PROVIDER);
  });

  it("creates nested directories recursively", () => {
    const filePath = path.join(tmpDir, "deep", "nested", "models.json");
    const result = upsertProvider(filePath, "vikey", SAMPLE_PROVIDER);
    expect(result.success).toBe(true);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("preserves other providers when merging", () => {
    const filePath = targetPath();
    writeModelsJson(filePath, {
      providers: { ollama: { baseUrl: "http://localhost:11434/v1" } },
    });

    upsertProvider(filePath, "vikey", SAMPLE_PROVIDER);

    const doc = readModelsJson(filePath);
    expect(doc.providers?.ollama).toEqual({ baseUrl: "http://localhost:11434/v1" });
    expect(doc.providers?.vikey).toEqual(SAMPLE_PROVIDER);
  });

  it("overwrites an existing vikey provider entry", () => {
    const filePath = targetPath();
    upsertProvider(filePath, "vikey", { ...SAMPLE_PROVIDER, baseUrl: "old" });
    upsertProvider(filePath, "vikey", SAMPLE_PROVIDER);

    const doc = readModelsJson(filePath);
    expect(doc.providers?.vikey).toEqual(SAMPLE_PROVIDER);
  });

  it("reports failure for invalid target paths", () => {
    const result = upsertProvider(
      path.join(tmpDir, "\u0000invalid", "models.json"),
      "vikey",
      SAMPLE_PROVIDER,
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("Gagal menulis");
  });
});

describe("readModelsJson", () => {
  it("returns an empty document for missing files", () => {
    expect(readModelsJson(targetPath("missing.json"))).toEqual({ providers: {} });
  });

  it("returns a clean document for corrupt files", () => {
    const filePath = targetPath("corrupt.json");
    fs.writeFileSync(filePath, "{ not valid json !!!", "utf-8");
    expect(readModelsJson(filePath)).toEqual({ providers: {} });
  });

  it("returns an empty document for a non-object JSON file", () => {
    const filePath = targetPath("array.json");
    fs.writeFileSync(filePath, "[1,2,3]", "utf-8");
    expect(readModelsJson(filePath)).toEqual({ providers: {} });
  });

  it("round-trips a parsed document", () => {
    const filePath = targetPath();
    const doc = { providers: { vikey: SAMPLE_PROVIDER } };
    writeModelsJson(filePath, doc);
    expect(readModelsJson(filePath)).toEqual(doc);
  });
});