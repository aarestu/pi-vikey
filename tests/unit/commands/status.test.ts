import { describe, expect, it } from "vitest";
import { buildStatusReport } from "../../../src/commands/status.ts";
import { VIKEY_DEFAULT_BASE_URL } from "../../../src/catalog/catalog.ts";

describe("buildStatusReport", () => {
  it("reports a configured key with a masked preview", () => {
    const report = buildStatusReport({ apiKey: "sk-vikey-abcdefgh" });
    expect(report.hasApiKey).toBe(true);
    expect(report.maskedKey).toBe("sk-v...efgh");
  });

  it("reports a missing key as unset", () => {
    const report = buildStatusReport({ apiKey: undefined });
    expect(report.hasApiKey).toBe(false);
    expect(report.maskedKey).toContain("Belum diatur");
  });

  it("counts models from the catalog", () => {
    const report = buildStatusReport({ apiKey: "sk-x" });
    expect(report.modelCount).toBeGreaterThan(0);
  });

  it("renders the base URL and command hints", () => {
    const { message } = buildStatusReport({ apiKey: "sk-x" });
    expect(message).toContain(VIKEY_DEFAULT_BASE_URL);
    expect(message).toContain("/vikey-models");
    expect(message).toContain("/vikey-test");
    expect(message).toContain("/vikey-setup");
    expect(message).toContain("pi --model vikey/claude-3-7-sonnet");
  });

  it("renders the configured models.json path", () => {
    const { message } = buildStatusReport({
      apiKey: "sk-x",
      modelsJsonPath: "/custom/path/models.json",
    });
    expect(message).toContain("/custom/path/models.json");
  });
});