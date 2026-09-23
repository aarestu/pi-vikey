import { describe, expect, it } from "vitest";
import { buildProviderConfig, VIKEY_API_FLAVOR } from "../../../src/catalog/provider.ts";
import { VIKEY_MODEL_CATALOG, VIKEY_DEFAULT_BASE_URL } from "../../../src/catalog/catalog.ts";

describe("buildProviderConfig", () => {
  it("maps every catalog model", () => {
    const config = buildProviderConfig();
    expect(config.models).toHaveLength(VIKEY_MODEL_CATALOG.length);
  });

  it("uses openai-completions API and the default endpoint", () => {
    const config = buildProviderConfig();
    expect(config.api).toBe(VIKEY_API_FLAVOR);
    expect(config.baseUrl).toBe(VIKEY_DEFAULT_BASE_URL);
  });

  it("references the API key as an env variable reference", () => {
    expect(buildProviderConfig().apiKey).toBe("$VIKEY_API_KEY");
    expect(buildProviderConfig("MY_KEY").apiKey).toBe("$MY_KEY");
  });

  it("derives reasoning and cost for every model", () => {
    const config = buildProviderConfig();
    for (const model of config.models) {
      expect(typeof model.reasoning, model.id).toBe("boolean");
      expect(model.cost).toEqual({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
      expect(model.input).toContain("text");
    }
  });

  it("flags reasoning models as reasoning-capable", () => {
    const config = buildProviderConfig();
    const claude = config.models.find((m) => m.id === "claude-3-7-sonnet");
    const deepseek = config.models.find((m) => m.id === "deepseek-reasoner");
    const gpt4o = config.models.find((m) => m.id === "gpt-4o");
    expect(claude?.reasoning).toBe(true);
    expect(deepseek?.reasoning).toBe(true);
    expect(gpt4o?.reasoning).toBe(false);
  });

  it("respects a custom baseUrl override", () => {
    const config = buildProviderConfig("VIKEY_API_KEY", "https://proxy.example.com/v1");
    expect(config.baseUrl).toBe("https://proxy.example.com/v1");
  });
});