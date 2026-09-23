import { describe, expect, it, vi } from "vitest";
import {
  EMPTY_USAGE_SUMMARY,
  fetchApiKeys,
  fetchUsageSummary,
  parseApiKeys,
  parseUsageSummary,
} from "../../../src/api/usage.js";

type FetchImpl = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function jsonResponse(ok: boolean, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const KEY = "vk-2bf894d3-8297-4d81-8447-6ca91ae84a7e";

describe("parseUsageSummary", () => {
  it("parses the gateway summary envelope", () => {
    const summary = parseUsageSummary({
      data: [],
      summary: {
        totalRequests: 12,
        successCount: 11,
        errorCount: 1,
        totalInputTokens: 3456,
        totalOutputTokens: 789,
        totalTokens: 4245,
        totalCost: 1234.5,
      },
    });

    expect(summary.totalRequests).toBe(12);
    expect(summary.totalTokens).toBe(4245);
    expect(summary.totalCost).toBe(1234.5);
  });

  it("falls back to zeros for unexpected shapes", () => {
    expect(parseUsageSummary(null)).toEqual(EMPTY_USAGE_SUMMARY);
    expect(parseUsageSummary({ summary: "nope" })).toEqual(EMPTY_USAGE_SUMMARY);
    expect(parseUsageSummary({ summary: { totalRequests: "x" } })).toEqual(EMPTY_USAGE_SUMMARY);
  });
});

describe("parseApiKeys", () => {
  const payload = {
    data: [
      { id: "1", name: "localku", key: "vk-fc0ff633-51ee-4a81-b029-5d817ae8a07b", usageLimit: null, usageCount: 363, isActive: true, createdAt: "2026-09-14T07:36:44.425Z" },
      { id: "2", name: "restu-pc", key: KEY, usageLimit: 1000, usageCount: 0, isActive: true },
      { id: "3", name: "old", key: "vk-old-key-value-1234", usageLimit: 5, usageCount: 5, isActive: false },
    ],
  };

  it("masks raw keys and never exposes them", () => {
    const keys = parseApiKeys(payload, KEY);
    for (const key of keys) {
      expect(key.maskedKey).not.toContain("51ee");
      expect(key.maskedKey).toMatch(/\.\.\./);
    }
  });

  it("flags the key used for the request", () => {
    const keys = parseApiKeys(payload, KEY);
    expect(keys.find((k) => k.isCurrent)?.name).toBe("restu-pc");
    expect(keys.filter((k) => k.isCurrent)).toHaveLength(1);
  });

  it("maps usage counters, limits and status", () => {
    const keys = parseApiKeys(payload, KEY);
    const localku = keys.find((k) => k.name === "localku");
    expect(localku?.usageCount).toBe(363);
    expect(localku?.usageLimit).toBeNull();
    expect(localku?.isActive).toBe(true);
    expect(localku?.createdAt).toBe("2026-09-14T07:36:44.425Z");

    const restu = keys.find((k) => k.name === "restu-pc");
    expect(restu?.usageLimit).toBe(1000);
  });

  it("tolerates malformed entries and missing names", () => {
    const keys = parseApiKeys({ data: [{ id: "1" }, "junk", { noId: true }, null] }, KEY);
    expect(keys).toHaveLength(1);
    expect(keys[0]?.name).toBe("(tanpa nama)");
  });

  it("returns an empty list for unexpected payloads", () => {
    expect(parseApiKeys(null)).toEqual([]);
    expect(parseApiKeys({ data: "nope" })).toEqual([]);
  });
});

describe("fetchUsageSummary", () => {
  it("fetches and parses the summary", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () =>
      jsonResponse(true, 200, { summary: { totalRequests: 3, totalTokens: 100 } }),
    );

    const result = await fetchUsageSummary(KEY, { fetchImpl: fetchMock });

    expect(result.ok).toBe(true);
    expect(result.summary.totalRequests).toBe(3);
    expect(requireDefined(fetchMock.mock.calls[0])[0]).toBe("https://api.vikey.ai/v1/api-keys/usage");
    expect(
      (requireDefined(fetchMock.mock.calls[0])[1]?.headers as Record<string, string>).Authorization,
    ).toBe(`Bearer ${KEY}`);
  });

  it("forwards the abort signal", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse(true, 200, {}));

    await fetchUsageSummary(KEY, { fetchImpl: fetchMock, signal: controller.signal });

    expect(requireDefined(fetchMock.mock.calls[0])[1]?.signal).toBe(controller.signal);
  });

  it("reports HTTP errors as values", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse(false, 401, { error: {} }));

    const result = await fetchUsageSummary(KEY, { fetchImpl: fetchMock });

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(result.summary).toEqual(EMPTY_USAGE_SUMMARY);
    expect(result.message).toContain("HTTP 401");
  });

  it("reports network failures without throwing", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => {
      throw new Error("ECONNREFUSED");
    });

    const result = await fetchUsageSummary(KEY, { fetchImpl: fetchMock });

    expect(result.ok).toBe(false);
    expect(result.message).toContain("ECONNREFUSED");
  });
});

describe("fetchApiKeys", () => {
  it("returns parsed keys on success", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () =>
      jsonResponse(true, 200, { data: [{ id: "1", name: "k", key: KEY, usageCount: 2, isActive: true }] }),
    );

    const result = await fetchApiKeys(KEY, { fetchImpl: fetchMock });

    expect(result.ok).toBe(true);
    expect(result.keys).toHaveLength(1);
    expect(result.keys[0]?.isCurrent).toBe(true);
    expect(requireDefined(fetchMock.mock.calls[0])[0]).toBe("https://api.vikey.ai/v1/api-keys");
  });

  it("honours a custom base URL and strips trailing slashes", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse(true, 200, { data: [] }));

    await fetchApiKeys(KEY, { baseUrl: "http://localhost:4599/v1/", fetchImpl: fetchMock });

    expect(requireDefined(fetchMock.mock.calls[0])[0]).toBe("http://localhost:4599/v1/api-keys");
  });

  it("returns an empty list on failure", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse(false, 500, {}));

    const result = await fetchApiKeys(KEY, { fetchImpl: fetchMock });

    expect(result.ok).toBe(false);
    expect(result.keys).toEqual([]);
  });
});

function requireDefined<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error("Unexpected undefined in test fixture");
  }
  return value;
}