import { describe, expect, it } from "vitest";
import { parseSetupArgs } from "../../../src/cli/args.ts";

describe("parseSetupArgs", () => {
  it("defaults to a global non-test run", () => {
    expect(parseSetupArgs([])).toEqual({
      test: false,
      project: false,
      help: false,
    });
  });

  it("parses --test", () => {
    expect(parseSetupArgs(["--test"]).test).toBe(true);
  });

  it("parses --project", () => {
    expect(parseSetupArgs(["--project"]).project).toBe(true);
  });

  it("parses --help and -h", () => {
    expect(parseSetupArgs(["--help"]).help).toBe(true);
    expect(parseSetupArgs(["-h"]).help).toBe(true);
  });

  it("captures --key and --output values", () => {
    const args = parseSetupArgs(["--key", "sk-vikey-1", "--output", "./x.json"]);
    expect(args.key).toBe("sk-vikey-1");
    expect(args.output).toBe("./x.json");
  });

  it("combines flags in one invocation", () => {
    const args = parseSetupArgs(["--test", "--project", "--key", "k"]);
    expect(args).toMatchObject({ test: true, project: true, key: "k" });
  });

  it("ignores unknown flags for forward compatibility", () => {
    expect(() => parseSetupArgs(["--future-flag"])).not.toThrow();
  });
});