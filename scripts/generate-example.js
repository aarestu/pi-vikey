#!/usr/bin/env node

/**
 * Regenerates models.example.json from the single source of truth
 * (src/catalog/*). Run `npm run generate:example` after changing
 * the catalog to keep the template in sync.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { buildProviderConfig } from "../dist/catalog/provider.js";
import { VIKEY_PROVIDER_ID } from "../dist/catalog/catalog.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(rootDir, "models.example.json");

const doc = {
  providers: {
    [VIKEY_PROVIDER_ID]: buildProviderConfig(),
  },
};

fs.writeFileSync(target, `${JSON.stringify(doc, null, 2)}\n`, "utf-8");
console.log(`✅ models.example.json regenerated (${path.relative(rootDir, target)})`);