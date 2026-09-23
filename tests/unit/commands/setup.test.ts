import { describe, expect, it, vi } from "vitest";
import { runSetupCommand } from "../../../src/commands/setup.ts";
import { upsertProvider } from "../../../src/config/modelsJson.ts";
import type { UpsertResult } from "../../../src/config/modelsJson.ts";

const SUCCESS: UpsertResult = {
  success: true,
  filePath: "/tmp/models.json",
  modelCount: 16,
  message: 'Konfigurasi provider "vikey" berhasil disimpan ke: /tmp/models.json',
};

describe("runSetupCommand", () => {
  it("renders a success message with next steps", () => {
    const upsert = vi.fn(
      (_filePath: string, _providerId: string, _config: unknown): UpsertResult => SUCCESS,
    );
    const { result, message } = runSetupCommand({
      filePath: "/tmp/models.json",
      upsert: upsert as typeof upsertProvider,
    });

    expect(result.success).toBe(true);
    expect(upsert).toHaveBeenCalledWith(
      "/tmp/models.json",
      "vikey",
      expect.objectContaining({ api: "openai-completions" }),
    );
    expect(message).toContain("/reload");
    expect(message).toContain("/model");
  });

  it("renders a failure message", () => {
    const upsert = vi.fn(
      (_filePath: string, _providerId: string, _config: unknown): UpsertResult => ({
        success: false,
        filePath: "/tmp/models.json",
        message: "Gagal menulis ke /tmp/models.json: EACCES",
      }),
    );
    const { message } = runSetupCommand({
      filePath: "/tmp/models.json",
      upsert: upsert as typeof upsertProvider,
    });

    expect(message).toContain("❌");
    expect(message).toContain("EACCES");
  });

  it("builds a provider config with all catalog models", () => {
    const upsert = vi.fn(
      (_filePath: string, _providerId: string, _config: unknown): UpsertResult => SUCCESS,
    );
    runSetupCommand({
      filePath: "/tmp/models.json",
      upsert: upsert as typeof upsertProvider,
    });

    const config = requireDefined(upsert.mock.calls[0])[2] as { models: unknown[] };
    expect(config.models.length).toBeGreaterThan(0);
  });
});

function requireDefined<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error("Unexpected undefined in test fixture");
  }
  return value;
}