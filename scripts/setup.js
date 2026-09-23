#!/usr/bin/env node

/**
 * Backward-compatible entry for `node scripts/setup.js`.
 * Real implementation lives in TypeScript at src/cli/setup.ts
 * (compiled to dist/cli/setup.js). Build first: `npm run build`.
 */

import { runSetupCli } from "../dist/cli/setup.js";

const exitCode = await runSetupCli(process.argv.slice(2));
process.exit(exitCode);