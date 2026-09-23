import { describe, expect, it, vi } from "vitest";
import type { Api, Model, ModelsStoreEntry, RefreshModelsContext } from "@earendil-works/pi-ai";
import { refreshVikeyModels } from "../../../src/api/refresh.js";
import type { RemoteModelsResult } from "../../../src/api/models-fetch.js";
import { buildProviderConfig } from "../../../src/catalog/provider.js";

const BASELINE_LENGTH = buildProviderConfig().models.length;

const CACHED_MODEL: Model<Api> = {
  id: "remote-live-model",
  name: "Remote Live Model",
  api: "openai-completions",
  provider: "vikey",
  baseUrl: "https://api.vikey.ai/v1",
  reasoning: false,
  input: ["text"],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 128000,
  maxTokens: 16384,
};

const SNAPSHOT: ModelsStoreEntry = { models: [CACHED_MODEL], checkedAt: 999 };

function makeContext(
  overrides: Partial<RefreshModelsContext> = {},
): RefreshModelsContext {
  return {
    publish: (async (_publication: unknown) => true) as RefreshModelsContext["publish"],
    allowNetwork: false,
    signal: new AbortController().signal,
    ...overrides,
  } as RefreshModelsContext;
}

function makeFetchResult(
  overrides: Partial<RemoteModelsResult> = {},
): RemoteModelsResult {
  return {
    ok: true,
    modelIds: ["gpt-4o", "brand-new-model"],
    message: "ok",
    latencyMs: 12,
    ...overrides,
  };
}

function makeDeps(
  result: RemoteModelsResult,
  fetchSpy?: (apiKey: string) => Promise<RemoteModelsResult>,
) {
  return {
    fetchModels: fetchSpy ?? (async () => result),
    now: () => 1_000,
  };
}

describe("refreshVikeyModels", () => {
  it("offline phase: returns the persisted snapshot when available", async () => {
    const result = await refreshVikeyModels(
      makeContext({ stored: SNAPSHOT }),
      makeDeps(makeFetchResult()),
    );

    expect(result.map((m) => m.id)).toEqual(["remote-live-model"]);
  });

  it("offline phase without snapshot: returns the static baseline", async () => {
    const fetchSpy = vi.fn();
    const result = await refreshVikeyModels(
      makeContext(),
      makeDeps(makeFetchResult(), fetchSpy as unknown as (apiKey: string) => Promise<RemoteModelsResult>),
    );

    expect(result).toHaveLength(BASELINE_LENGTH);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("network phase: fetches the live list and persists a snapshot", async () => {
    const publish = vi.fn(async (_publication: unknown) => true);
    const context = makeContext({ allowNetwork: true, credential: { type: "api_key", key: "sk-live" }, publish });
    const fetchSpy = vi.fn(async () => makeFetchResult());

    const result = await refreshVikeyModels(context, makeDeps(makeFetchResult(), fetchSpy));

    expect(fetchSpy).toHaveBeenCalledWith("sk-live", expect.objectContaining({ signal: context.signal }));
    expect(result.map((m) => m.id)).toEqual(["gpt-4o", "brand-new-model"]);

    interface PersistPublication {
      persist?: { models: ReadonlyArray<Model<Api>>; checkedAt: number } | null;
    }
    const publication = requireDefined(publish.mock.calls[0]?.[0]) as PersistPublication;
    const snapshot = requireDefined(publication.persist);
    expect(snapshot.models.map((m) => m.id)).toEqual(["gpt-4o", "brand-new-model"]);
    expect(snapshot.checkedAt).toBe(1_000);
  });

  it("network phase without credential: falls back without fetching", async () => {
    const fetchSpy = vi.fn();
    const result = await refreshVikeyModels(
      makeContext({ allowNetwork: true }),
      makeDeps(makeFetchResult(), fetchSpy as unknown as (apiKey: string) => Promise<RemoteModelsResult>),
    );

    expect(result).toHaveLength(BASELINE_LENGTH);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("network failure: keeps the last known list (stored preferred, else baseline)", async () => {
    const fetchFailures = makeDeps(makeFetchResult({ ok: false, message: "boom" }));

    const withStored = await refreshVikeyModels(
      makeContext({
        allowNetwork: true,
        credential: { type: "api_key", key: "sk-live" },
        stored: { models: [{ ...CACHED_MODEL, id: "cached", name: "c" }], checkedAt: 1 },
      }),
      fetchFailures,
    );
    expect(withStored.map((m) => m.id)).toEqual(["cached"]);

    const withoutStored = await refreshVikeyModels(
      makeContext({ allowNetwork: true, credential: { type: "api_key", key: "sk-live" } }),
      fetchFailures,
    );
    expect(withoutStored).toHaveLength(BASELINE_LENGTH);
  });

  it("empty remote list: keeps the fallback instead of blanking the provider", async () => {
    const publish = vi.fn(async (_publication: unknown) => true);
    const result = await refreshVikeyModels(
      makeContext({
        allowNetwork: true,
        credential: { type: "api_key", key: "sk-live" },
        publish,
      }),
      makeDeps(makeFetchResult({ ok: true, modelIds: [] })),
    );

    expect(result).toHaveLength(BASELINE_LENGTH);
    expect(publish).not.toHaveBeenCalled();
  });

  it("never returns an empty array in any phase", async () => {
    const offline = await refreshVikeyModels(makeContext(), makeDeps(makeFetchResult()));
    const offlineNoSnapshot = await refreshVikeyModels(makeContext(), makeDeps(makeFetchResult()));
    const networkFail = await refreshVikeyModels(
      makeContext({ allowNetwork: true, credential: { type: "api_key", key: "k" } }),
      makeDeps(makeFetchResult({ ok: false, message: "x" })),
    );

    expect(offline.length).toBeGreaterThan(0);
    expect(offlineNoSnapshot.length).toBeGreaterThan(0);
    expect(networkFail.length).toBeGreaterThan(0);
  });
});

function requireDefined<T>(value: T | null | undefined): T {
  if (value === undefined || value === null) {
    throw new Error("Unexpected undefined/null in test fixture");
  }
  return value;
}