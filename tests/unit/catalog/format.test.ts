import { describe, expect, it } from "vitest";
import {
  formatModelsListMarkdown,
  formatRemoteModelsMarkdown,
  formatContextWindow,
  formatMaxTokens,
} from "../../../src/catalog/format.ts";
import { VIKEY_MODEL_CATALOG, getRecommendedModels } from "../../../src/catalog/catalog.ts";

describe("formatContextWindow", () => {
  it("formats thousands as k", () => {
    expect(formatContextWindow(200_000)).toBe("200k");
    expect(formatContextWindow(64000)).toBe("64k");
  });

  it("formats millions as M", () => {
    expect(formatContextWindow(1_000_000)).toBe("1M");
    expect(formatContextWindow(2_097_152)).toBe("2.1M");
  });
});

describe("formatMaxTokens", () => {
  it("formats tokens as k", () => {
    expect(formatMaxTokens(64000)).toBe("64k");
    expect(formatMaxTokens(8192)).toBe("8k");
  });
});

describe("formatModelsListMarkdown", () => {
  it("includes the base URL and the full catalog", () => {
    const markdown = formatModelsListMarkdown();
    expect(markdown).toContain("https://api.vikey.ai/v1");
    for (const model of VIKEY_MODEL_CATALOG) {
      expect(markdown, model.id).toContain(model.id);
    }
  });

  it("contains markdown table headers", () => {
    const markdown = formatModelsListMarkdown();
    expect(markdown).toContain("| Model ID |");
    expect(markdown).toContain("| :--- |");
  });

  it("marks recommended models", () => {
    const markdown = formatModelsListMarkdown();
    const recommended = getRecommendedModels();
    expect(recommended.length).toBeGreaterThan(0);
    expect(markdown).toContain("⭐ Ya");
  });

  it("renders well-formed markdown table rows", () => {
    const markdown = formatModelsListMarkdown(VIKEY_MODEL_CATALOG.slice(0, 2));
    const rows = markdown.split("\n").filter((line) => line.startsWith("| `"));
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row).toMatch(/^\| .* \|$/);
      expect(row).not.toContain("| |");
    }
  });

  it("renders well-formed markdown table rows", () => {
    const models = [
      { id: "gpt-4o", name: "GPT-4o", contextWindow: 128000, maxTokens: 16384, reasoning: true },
    ];
    const rows = formatRemoteModelsMarkdown(models)
      .split("\n")
      .filter((line) => line.startsWith("| `"));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toBe("| `gpt-4o` | GPT-4o | 128k | 16k | ✓ |");
  });

  it("renders a subset catalog when provided", () => {
    const first = requireDefined(VIKEY_MODEL_CATALOG[0]);
    const second = requireDefined(VIKEY_MODEL_CATALOG[1]);
    const third = requireDefined(VIKEY_MODEL_CATALOG[2]);
    const subset = VIKEY_MODEL_CATALOG.slice(0, 2);

    const markdown = formatModelsListMarkdown(subset);
    expect(markdown).toContain(first.id);
    expect(markdown).toContain(second.id);
    expect(markdown).not.toContain(third.id);
  });
});

function requireDefined<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error("Unexpected undefined in test fixture");
  }
  return value;
}