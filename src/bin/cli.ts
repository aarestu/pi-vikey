#!/usr/bin/env node

/**
 * `pi-vikey` CLI entry — dispatches to the setup or test flows
 * by calling the same modules the npm scripts use (no shell-outs).
 */

import { runSetupCli } from "../cli/setup.js";
import { runTestCli } from "../cli/test-connection.js";
import { runUsageCli } from "../cli/usage.js";

const HELP = `
pi-vikey CLI — Vikey.ai provider manager for Pi Coding Agent

Usage:
  pi-vikey setup             Register Vikey.ai provider in ~/.pi/agent/models.json
  pi-vikey setup --project   Register in the current project's .pi/models.json
  pi-vikey setup --test      Validate config without writing
  pi-vikey test              Test API connection to Vikey.ai
  pi-vikey usage             Show API key usage, tokens and cost
  pi-vikey --help            Show this help
`;

async function main(): Promise<number> {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case "setup":
      return runSetupCli(rest);
    case "test":
      return runTestCli();
    case "usage":
      return runUsageCli();
    case "--help":
    case "-h":
    case undefined:
      console.log(HELP);
      return 0;
    default:
      console.error(`Perintah tidak dikenal: ${command}`);
      console.error("Jalankan pi-vikey --help untuk bantuan.");
      return 1;
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err: unknown) => {
    console.error("❌ Error tak terduga:", err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  },
);