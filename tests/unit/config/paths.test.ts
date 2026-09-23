import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { getPiModelsJsonPath, getProjectModelsPath } from "../../../src/config/paths.ts";

describe("getPiModelsJsonPath", () => {
  it("resolves to <home>/.pi/agent/models.json", () => {
    expect(getPiModelsJsonPath("/home/test")).toBe(
      path.join("/home/test", ".pi", "agent", "models.json"),
    );
  });

  it("defaults to the OS home directory", () => {
    expect(getPiModelsJsonPath()).toBe(
      path.join(os.homedir(), ".pi", "agent", "models.json"),
    );
  });
});

describe("getProjectModelsPath", () => {
  it("resolves to <cwd>/.pi/models.json", () => {
    expect(getProjectModelsPath("/work/app")).toBe(
      path.join("/work/app", ".pi", "models.json"),
    );
  });
});