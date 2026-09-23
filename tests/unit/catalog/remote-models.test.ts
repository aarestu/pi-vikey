import { describe, expect, it } from "vitest";
import {
  buildProviderModelsFromIds,
  REMOTE_MODEL_DEFAULT_LIMITS,
} from "../../../src/catalog/provider.js";
import { VIKEY_MODEL_CATALOG, getModelById } from "../../../src/catalog/catalog.js";

describe("buildProviderModelsFromIds", () => {
  it("enriches known ids with curated catalog metadata", () => {
    const claude = getModelById("claude-3-7-sonnet");
    expect(claude).toBeDefined();

    const [model] = buildProviderModelsFromIds(["claude-3-7-sonnet"]);

    expect(model?.id).toBe("claude-3-7-sonnet");
    expect(model?.name).toBe(claude?.name);
    expect(model?.contextWindow).toBe(claude?.contextWindow);
    expect(model?.maxTokens).toBe(claude?.maxTokens);
    expect(model?.reasoning).toBe(true);
    expect(model?.input).toContain("image");
  });

  it("applies conservative defaults to unknown ids", () => {
    const [model] = buildProviderModelsFromIds(["totally-unknown-model"]);

    expect(model?.id).toBe("totally-unknown-model");
    expect(model?.contextWindow).toBe(REMOTE_MODEL_DEFAULT_LIMITS.contextWindow);
    expect(model?.maxTokens).toBe(REMOTE_MODEL_DEFAULT_LIMITS.maxTokens);
    expect(model?.reasoning).toBe(false);
    expect(model?.input).toEqual(["text"]);
  });

  it("detects reasoning-capable unknown ids by pattern", () => {
    for (const id of ["deepseek-r1-new", "vendor-reasoner-x", "o3-next", "thinking-pro"]) {
      const [model] = buildProviderModelsFromIds([id]);
      expect(model?.reasoning, id).toBe(true);
    }
  });

  it("preserves remote order", () => {
    const models = buildProviderModelsFromIds(["zzz-model", "aaa-model", "mmm-model"]);
    expect(models.map((m) => m.id)).toEqual(["zzz-model", "aaa-model", "mmm-model"]);
  });

  it("deduplicates ids", () => {
    const models = buildProviderModelsFromIds(["gpt-4o", "gpt-4o", "gpt-4o"]);
    expect(models).toHaveLength(1);
  });

  it("skips invalid entries", () => {
    const models = buildProviderModelsFromIds(["", "ok-model"]);
    expect(models.map((m) => m.id)).toEqual(["ok-model"]);
  });

  it("maps the full catalog when the gateway returns all curated ids", () => {
    const allIds = VIKEY_MODEL_CATALOG.map((m) => m.id);
    const models = buildProviderModelsFromIds(allIds);
    expect(models).toHaveLength(VIKEY_MODEL_CATALOG.length);
    expect(models.every((m) => m.reasoning === (getModelById(m.id)?.reasoning ?? false))).toBe(
      true,
    );
  });
});