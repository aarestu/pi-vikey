import { describe, expect, it, vi } from "vitest";
import { buildTestCommand } from "../../../src/commands/test.ts";
import { testVikeyConnection } from "../../../src/api/client.ts";
import type { VikeyTestResult } from "../../../src/api/client.ts";

const OK_RESULT: VikeyTestResult = {
  ok: true,
  statusCode: 200,
  latencyMs: 42,
  modelsFound: ["gpt-4o"],
  message: "Berhasil terhubung ke Vikey.ai dalam 42ms! Ditemukan 1 model remote.",
};

describe("buildTestCommand", () => {
  it("asks for a key when none is configured", async () => {
    const { result, message } = await buildTestCommand({ apiKey: undefined });
    expect(result).toBeNull();
    expect(message).toContain("/login vikey");
  });

  it("reports a successful connection", async () => {
    const testConnection = vi.fn(async () => OK_RESULT);
    const { result, message } = await buildTestCommand({
      apiKey: "sk-vikey-12345678",
      testConnection: testConnection as typeof testVikeyConnection,
    });

    expect(result?.ok).toBe(true);
    expect(message).toContain("✅");
    expect(message).toContain("42ms");
    expect(message).toContain("1 model remote");
  });

  it("reports a failed connection", async () => {
    const testConnection = vi.fn(async () => ({
      ok: false,
      statusCode: 401,
      message: "invalid key",
    }));
    const { message } = await buildTestCommand({
      apiKey: "sk-vikey-12345678",
      testConnection: testConnection as typeof testVikeyConnection,
    });

    expect(message).toContain("❌");
    expect(message).toContain("invalid key");
  });

  it("passes options through to the injected client", async () => {
    const testConnection = vi.fn(async () => OK_RESULT);
    await buildTestCommand({
      apiKey: "sk-vikey-12345678",
      options: { baseUrl: "https://proxy.example.com/v1" },
      testConnection: testConnection as typeof testVikeyConnection,
    });

    expect(testConnection).toHaveBeenCalledWith(
      "sk-vikey-12345678",
      expect.objectContaining({ baseUrl: "https://proxy.example.com/v1" }),
    );
  });
});