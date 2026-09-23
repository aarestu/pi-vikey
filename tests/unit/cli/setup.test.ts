import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runSetupCli } from "../../../src/cli/setup.ts";
import { readModelsJson } from "../../../src/config/modelsJson.ts";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vikey-cli-"));
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("runSetupCli", () => {
  it("writes the vikey provider to --output", async () => {
    const target = path.join(tmpDir, "models.json");
    const exitCode = await runSetupCli(["--output", target]);

    expect(exitCode).toBe(0);
    expect(fs.existsSync(target)).toBe(true);

    const doc = readModelsJson(target);
    expect(doc.providers?.vikey).toBeDefined();
    const provider = doc.providers?.vikey as { models: unknown[] };
    expect(provider.models.length).toBeGreaterThan(0);
  });

  it("--test mode validates without writing any file", async () => {
    const target = path.join(tmpDir, "should-not-exist.json");
    const exitCode = await runSetupCli(["--test", "--output", target]);

    expect(exitCode).toBe(0);
    expect(fs.existsSync(target)).toBe(false);
  });

  it("--project writes to <cwd>/.pi/models.json", async () => {
    const exitCode = await runSetupCli(["--project"], { cwd: tmpDir });

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(tmpDir, ".pi", "models.json"))).toBe(true);
  });

  it("--help prints usage and exits cleanly", async () => {
    const exitCode = await runSetupCli(["--help"]);
    expect(exitCode).toBe(0);
  });

  it("preserves existing providers when merging", async () => {
    const target = path.join(tmpDir, "models.json");
    const { writeModelsJson } = await import("../../../src/config/modelsJson.ts");
    writeModelsJson(target, { providers: { ollama: { baseUrl: "http://localhost:11434/v1" } } });

    await runSetupCli(["--output", target]);

    const doc = readModelsJson(target);
    expect(doc.providers?.ollama).toEqual({ baseUrl: "http://localhost:11434/v1" });
    expect(doc.providers?.vikey).toBeDefined();
  });
});