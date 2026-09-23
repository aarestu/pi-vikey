import { describe, expect, it } from "vitest";
import {
  VIKEY_MODEL_CATALOG,
  getModelById,
  getModelsByCategory,
  getRecommendedModels,
  VIKEY_DEFAULT_BASE_URL,
  VIKEY_PROVIDER_ID,
} from "../../../src/catalog/catalog.ts";

describe("catalog", () => {
  it("exposes provider identity constants", () => {
    expect(VIKEY_PROVIDER_ID).toBe("vikey");
    expect(VIKEY_DEFAULT_BASE_URL).toBe("https://api.vikey.ai/v1");
  });

  it("contains a non-empty catalog", () => {
    expect(VIKEY_MODEL_CATALOG.length).toBeGreaterThan(0);
  });

  it("has unique model ids", () => {
    const ids = VIKEY_MODEL_CATALOG.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique model names", () => {
    const names = VIKEY_MODEL_CATALOG.map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every model has valid token limits (context >= max output)", () => {
    for (const model of VIKEY_MODEL_CATALOG) {
      expect(model.contextWindow, model.id).toBeGreaterThan(0);
      expect(model.maxTokens, model.id).toBeGreaterThan(0);
      expect(model.contextWindow, model.id).toBeGreaterThanOrEqual(model.maxTokens);
    }
  });

  it("every model accepts text input", () => {
    for (const model of VIKEY_MODEL_CATALOG) {
      expect(model.input, model.id).toContain("text");
    }
  });

  it("every model belongs to a known category", () => {
    const categories = new Set(VIKEY_MODEL_CATALOG.map((m) => m.category));
    for (const category of categories) {
      expect(["anthropic", "deepseek", "openai", "google", "opensource"]).toContain(category);
    }
  });

  it("getModelById returns the matching model", () => {
    const claude = getModelById("claude-3-7-sonnet");
    expect(claude).toBeDefined();
    expect(claude?.reasoning).toBe(true);
  });

  it("getModelById returns undefined for unknown ids", () => {
    expect(getModelById("not-a-model")).toBeUndefined();
  });

  it("getModelsByCategory groups every model exactly once", () => {
    const groups = getModelsByCategory();
    const total = [...groups.values()].reduce((sum, models) => sum + models.length, 0);
    expect(total).toBe(VIKEY_MODEL_CATALOG.length);
    expect(groups.size).toBeGreaterThanOrEqual(5);
  });

  it("getRecommendedModels returns only recommended entries", () => {
    const recommended = getRecommendedModels();
    expect(recommended.length).toBeGreaterThan(0);
    expect(recommended.every((m) => m.recommended === true)).toBe(true);
  });
});