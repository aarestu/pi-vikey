import { describe, expect, it } from "vitest";
import { maskApiKey } from "../../../src/util/mask.ts";

describe("maskApiKey", () => {
  it("masks long keys with first/last four characters", () => {
    expect(maskApiKey("sk-vikey-abcdefgh")).toBe("sk-v...efgh");
  });

  it("masks short keys entirely", () => {
    expect(maskApiKey("12345678")).toBe("****");
  });

  it("reports unset keys explicitly", () => {
    expect(maskApiKey(undefined)).toContain("Belum diatur");
    expect(maskApiKey("")).toContain("Belum diatur");
  });
});