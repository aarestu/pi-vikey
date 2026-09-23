import { describe, expect, it, vi } from "vitest";
import { testVikeyConnection, isValidApiKeyFormat } from "../../../src/api/client.ts";

type FetchImpl = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/** Build a JSON Response for fetch mocks. */
function jsonResponse(ok: boolean, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("isValidApiKeyFormat", () => {
  it("accepts long keys and rejects short/empty ones", () => {
    expect(isValidApiKeyFormat("sk-vikey-12345678")).toBe(true);
    expect(isValidApiKeyFormat("short")).toBe(false);
    expect(isValidApiKeyFormat("   ")).toBe(false);
  });
});

describe("testVikeyConnection", () => {
  it("reports success with remote model ids", async () => {
    const fetchMock = vi.fn<FetchImpl>(
      async () => jsonResponse(true, 200, { data: [{ id: "gpt-4o" }, { id: "claude-3-7-sonnet" }] }),
    );

    const result = await testVikeyConnection("sk-vikey-12345678", { fetchImpl: fetchMock });

    expect(result.ok).toBe(true);
    expect(result.modelsFound).toEqual(["gpt-4o", "claude-3-7-sonnet"]);
    expect(result.latencyMs).toBeTypeOf("number");
    expect(result.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("sends a Bearer token to the /models endpoint", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse(true, 200, { data: [] }));

    await testVikeyConnection("sk-vikey-12345678", { fetchImpl: fetchMock });

    const [url, init] = requireDefined(fetchMock.mock.calls[0]);
    expect(url).toBe("https://api.vikey.ai/v1/models");
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer sk-vikey-12345678",
    );
  });

  it("reports an unauthorized response with the status code", async () => {
    const fetchMock = vi.fn<FetchImpl>(
      async () => jsonResponse(false, 401, { error: { message: "invalid key" } }),
    );

    const result = await testVikeyConnection("sk-vikey-12345678", { fetchImpl: fetchMock });

    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(result.message).toContain("HTTP 401");
  });

  it("reports network failures without throwing", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => {
      throw new Error("ECONNREFUSED");
    });

    const result = await testVikeyConnection("sk-vikey-12345678", { fetchImpl: fetchMock });

    expect(result.ok).toBe(false);
    expect(result.message).toContain("ECONNREFUSED");
  });

  it("rejects an invalid key format before calling fetch", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse(true, 200, { data: [] }));

    const result = await testVikeyConnection("bad", { fetchImpl: fetchMock });

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("strips trailing slashes from the base URL", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse(true, 200, { data: [] }));

    await testVikeyConnection("sk-vikey-12345678", {
      baseUrl: "https://api.vikey.ai/v1/",
      fetchImpl: fetchMock,
    });

    expect(requireDefined(fetchMock.mock.calls[0])[0]).toBe("https://api.vikey.ai/v1/models");
  });

  it("tolerates unexpected response shapes", async () => {
    const fetchMock = vi.fn<FetchImpl>(async () => jsonResponse(true, 200, { unexpected: true }));

    const result = await testVikeyConnection("sk-vikey-12345678", { fetchImpl: fetchMock });

    expect(result.ok).toBe(true);
    expect(result.modelsFound).toEqual([]);
  });
});

function requireDefined<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error("Unexpected undefined in test fixture");
  }
  return value;
}