#!/usr/bin/env node

/**
 * Backward-compatible entry for `node scripts/test-connection.js`.
 * Real implementation lives in TypeScript at src/cli/test-connection.ts
 * (compiled to dist/cli/test-connection.js). Build first: `npm run build`.
 */

import { runTestCli } from "../dist/cli/test-connection.js";

const exitCode = await runTestCli();
process.exit(exitCode);