import { describe, expect, it, vi } from "vitest";
import { extractModelIds, fetchRemoteModelIds } from "../../../src/api/models-fetch.js";

type FetchImpl = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/** Build a JSON Response for fetch mocks. */
function jsonResponse(ok: boolean, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("extractModelIds", () => {
  it("extracts ids from a standard /models payload", () => {
    expect(
      extractModelIds({ data: [{ id: "gpt-4o" }, { id: "claude-3-7-sonnet" }] }),
    ).toEqual(["gpt-4o", "claude-3-7-sonnet"]);
  });

  it("tolerates unexpected shapes", () => {
    expect(extractModelIds({ unexpected: true })).toEqual([]);
    expect(extractModelIds(null)).toEqual([]);
    expect(extractModelIds({ data: [{ noId: true }, "str", { id: 42 }] })).toEqual([]);
  });
});

describe("fetchRemoteModelIds", () => {
  it("returns deduplicated model ids on success", async () => {
    const fetchMock = vi.fn<FetchImpl>(
      async () =>
        jsonResponse(true, 200, {
          data: [{ id: "gpt-4o" }, { id: "gpt-4o" }, { id: "claude-3-7-sonnet" }],
        }),
    );

    const result = await fetchRemoteModelIds("sk-vikey-12345678", { fetchImpl: fetchMock });

    expect(result.ok).toBe(true);
    expect(result.modelIds).toEqual(["gpt-4o", "claude-3-7-sonnet"]);
    expect(result.statusCode).toBe(200);
    expect(result.latencyMs).toBeTypeOf("number");
  });

  it("sends a Bearer token to the /models endpoint", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse(true, 200, { data: [] }));

    await fetchRemoteModelIds("sk-vikey-12345678", { fetchImpl: fetchMock });

    const [url, init] = requireDefined(fetchMock.mock.calls[0]);
    expect(url).toBe("https://api.vikey.ai/v1/models");
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer sk-vikey-12345678",
    );
  });

  it("reports an error result on HTTP failure without throwing", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse(false, 401, { error: {} }));

    const result = await fetchRemoteModelIds("sk-vikey-12345678", { fetchImpl: fetchMock });

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(result.modelIds).toEqual([]);
    expect(result.message).toContain("HTTP 401");
  });

  it("reports network failures without throwing", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => {
      throw new Error("ECONNREFUSED");
    });

    const result = await fetchRemoteModelIds("sk-vikey-12345678", { fetchImpl: fetchMock });

    expect(result.ok).toBe(false);
    expect(result.message).toContain("ECONNREFUSED");
  });

  it("forwards the abort signal to fetch", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse(true, 200, { data: [] }));

    await fetchRemoteModelIds("sk-vikey-12345678", {
      fetchImpl: fetchMock,
      signal: controller.signal,
    });

    expect(requireDefined(fetchMock.mock.calls[0])[1]?.signal).toBe(controller.signal);
  });

  it("strips trailing slashes from the base URL", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse(true, 200, { data: [] }));

    await fetchRemoteModelIds("sk-vikey-12345678", {
      baseUrl: "https://api.vikey.ai/v1/",
      fetchImpl: fetchMock,
    });

    expect(requireDefined(fetchMock.mock.calls[0])[0]).toBe("https://api.vikey.ai/v1/models");
  });
});

function requireDefined<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error("Unexpected undefined in test fixture");
  }
  return value;
}