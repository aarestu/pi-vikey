import { describe, expect, it, vi } from "vitest";
import { buildModelsMessage } from "../../../src/commands/list.js";
import type { FetchRemoteModelsOptions, RemoteModelsResult } from "../../../src/api/models-fetch.js";
import { VIKEY_MODEL_CATALOG } from "../../../src/catalog/catalog.js";

function okResult(modelIds: string[]): RemoteModelsResult {
  return { ok: true, modelIds, message: "ok", latencyMs: 7 };
}

describe("buildModelsMessage", () => {
  it("renders the live API list when a key is configured and the fetch succeeds", async () => {
    const fetchModels = vi.fn(async (_apiKey: string, _options?: FetchRemoteModelsOptions) =>
      okResult(["live-model-a", "live-model-b"]),
    );

    const message = await buildModelsMessage({ apiKey: "sk-vikey-12345678", fetchModels });

    expect(message).toContain("live dari API");
    expect(message).toContain("`live-model-a`");
    expect(message).toContain("`live-model-b`");
  });

  it("falls back to the static catalog when no key is configured", async () => {
    const fetchModels = vi.fn(async (_apiKey: string, _options?: FetchRemoteModelsOptions) =>
      okResult([]),
    );
    const message = await buildModelsMessage({ fetchModels });

    expect(fetchModels).not.toHaveBeenCalled();
    expect(message).toContain("Model Vikey.ai yang Tersedia");
    for (const model of VIKEY_MODEL_CATALOG.slice(0, 3)) {
      expect(message).toContain(model.id);
    }
  });

  it("falls back to the static catalog when the live fetch fails", async () => {
    const fetchModels = vi.fn(async (_apiKey: string, _options?: FetchRemoteModelsOptions) =>
      ({ ok: false, modelIds: [], message: "boom" }) as RemoteModelsResult,
    );

    const message = await buildModelsMessage({
      apiKey: "sk-vikey-12345678",
      fetchModels,
    });

    expect(message).toContain("Model Vikey.ai yang Tersedia");
  });

  it("falls back when the gateway returns an empty list", async () => {
    const fetchModels = vi.fn(async (_apiKey: string, _options?: FetchRemoteModelsOptions) =>
      okResult([]),
    );

    const message = await buildModelsMessage({
      apiKey: "sk-vikey-12345678",
      fetchModels,
    });

    expect(message).toContain("Model Vikey.ai yang Tersedia");
  });
});