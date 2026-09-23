import { describe, expect, it, vi } from "vitest";
import { buildUsageCommand } from "../../../src/commands/usage.js";
import type { ApiKeysResult, UsageSummaryResult } from "../../../src/api/usage.js";

const OK_USAGE: UsageSummaryResult = {
  ok: true,
  message: "ok",
  summary: {
    totalRequests: 12,
    successCount: 11,
    errorCount: 1,
    totalInputTokens: 3456,
    totalOutputTokens: 789,
    totalTokens: 4245,
    totalCost: 1234.5,
  },
};

const OK_KEYS: ApiKeysResult = {
  ok: true,
  message: "ok",
  keys: [
    { id: "1", name: "localku", maskedKey: "vk-f...07b", usageCount: 363, usageLimit: null, isActive: true, isCurrent: false },
    { id: "2", name: "restu-pc", maskedKey: "vk-2...a7e", usageCount: 0, usageLimit: 1000, isActive: true, isCurrent: true },
  ],
};

describe("buildUsageCommand", () => {
  it("asks for a key when none is configured", async () => {
    const { message, keys, usage } = await buildUsageCommand({ apiKey: undefined });
    expect(message).toContain("/login vikey");
    expect(keys).toEqual([]);
    expect(usage.totalRequests).toBe(0);
  });

  it("renders usage counters and the key table", async () => {
    const { message, usage, keys } = await buildUsageCommand({
      apiKey: "vk-current",
      fetchUsage: vi.fn(async () => OK_USAGE),
      fetchKeys: vi.fn(async () => OK_KEYS),
    });

    expect(usage.totalTokens).toBe(4245);
    expect(keys).toHaveLength(2);
    expect(message).toContain("Pemakaian Vikey.ai");
    expect(message).toContain("Total request: 12");
    expect(message).toContain("Token: 4.245");
    expect(message).toContain("localku");
    expect(message).toContain("restu-pc ← aktif");
    expect(message).toContain("∞");
  });

  it("explains that the account balance is not API-key readable", async () => {
    const { message } = await buildUsageCommand({
      apiKey: "vk-current",
      fetchUsage: vi.fn(async () => OK_USAGE),
      fetchKeys: vi.fn(async () => OK_KEYS),
    });

    expect(message).toContain("Saldo akun tidak dapat dibaca dengan API key");
  });

  it("reports a failure from the usage endpoint", async () => {
    const { message, usage } = await buildUsageCommand({
      apiKey: "vk-current",
      fetchUsage: vi.fn(async () => ({ ok: false, message: "HTTP 401", summary: usage0() })),
      fetchKeys: vi.fn(async () => OK_KEYS),
    });

    expect(message).toContain("❌");
    expect(message).toContain("HTTP 401");
    expect(usage.totalRequests).toBe(0);
  });

  it("still renders usage when the key list fails, with a warning", async () => {
    const { message, keys } = await buildUsageCommand({
      apiKey: "vk-current",
      fetchUsage: vi.fn(async () => OK_USAGE),
      fetchKeys: vi.fn(async () => ({ ok: false, message: "boom", keys: [] })),
    });

    expect(message).toContain("Token: 4.245");
    expect(message).toContain("Daftar API key gagal dimuat");
    expect(keys).toEqual([]);
  });
});

function usage0() {
  return {
    totalRequests: 0,
    successCount: 0,
    errorCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCost: 0,
  };
}