/**
 * Standalone setup CLI (`node dist/cli/setup.js` / npm run setup).
 *
 * Responsibilities:
 *   - parse argv (pure, see ./args.ts)
 *   - build the provider config (catalog/provider.ts)
 *   - persist it (config/modelsJson.ts)
 *   - print human-readable output
 */

import { buildProviderConfig } from "../catalog/provider.js";
import { VIKEY_DEFAULT_BASE_URL, VIKEY_PROVIDER_ID, VIKEY_PROVIDER_NAME } from "../catalog/catalog.js";
import { getPiModelsJsonPath, getProjectModelsPath } from "../config/paths.js";
import { writeModelsJson, readModelsJson } from "../config/modelsJson.js";
import { parseSetupArgs } from "./args.js";

const USAGE = `
pi-vikey Setup — Register Vikey.ai provider with Pi Coding Agent

Usage:
  node dist/cli/setup.js                    Write to ~/.pi/agent/models.json
  node dist/cli/setup.js --test             Validate only (no write)
  node dist/cli/setup.js --key <KEY>        Set API key (prints tip)
  node dist/cli/setup.js --project          Write to .pi/models.json in cwd
  node dist/cli/setup.js --output <FILE>    Write to custom path
  node dist/cli/setup.js --help             Show this help
`;

/** Run the setup flow; returns a process exit code. */
export async function runSetupCli(
  argv: ReadonlyArray<string>,
  options: { readonly cwd?: string } = {},
): Promise<number> {
  const args = parseSetupArgs(argv);

  if (args.help) {
    console.log(USAGE);
    return 0;
  }

  const providerConfig = buildProviderConfig("VIKEY_API_KEY", VIKEY_DEFAULT_BASE_URL);

  if (args.test) {
    printPreview(providerConfig);
    return 0;
  }

  const cwd = options.cwd ?? process.cwd();
  const targetPath = args.output ?? (args.project ? getProjectModelsPath(cwd) : getPiModelsJsonPath());

  try {
    const doc = readModelsJson(targetPath);
    const providers = doc.providers ?? {};
    providers[VIKEY_PROVIDER_ID] = providerConfig;
    writeModelsJson(targetPath, { ...doc, providers });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`❌ Gagal menulis ke ${targetPath}: ${detail}`);
    return 1;
  }

  console.log(`📝 Menulis konfigurasi provider Vikey.ai ke: ${targetPath}`);
  console.log(`✅ Selesai! ${providerConfig.models.length} model terdaftar.`);
  printNextSteps(args.key);

  return 0;
}

function printPreview(providerConfig: ReturnType<typeof buildProviderConfig>): void {
  console.log("🔍 Test mode — tidak ada file yang ditulis.\n");
  console.log(`Provider:         ${VIKEY_PROVIDER_NAME}`);
  console.log(`Base URL:         ${VIKEY_DEFAULT_BASE_URL}`);
  console.log(`API Key source:   /login vikey (auth.json) atau $VIKEY_API_KEY`);
  console.log(`API type:         ${providerConfig.api}`);
  console.log(`Model count:      ${providerConfig.models.length}`);
  console.log("");
  console.log("Model IDs:");
  for (const model of providerConfig.models) {
    console.log(`  - ${model.id}`);
  }
  console.log("");
  console.log("✅ Test passed — konfigurasi valid.");
}

function printNextSteps(inlineKey: string | undefined): void {
  console.log("");
  console.log("Langkah berikutnya:");
  console.log("  1. Restart Pi CLI atau ketik /reload");
  console.log("  2. Set API key: buka pi lalu jalankan /login vikey");
  console.log("     (tersimpan di ~/.pi/agent/auth.json — tidak perlu env)");
  console.log("  3. Pilih model lewat /model, atau:");
  console.log("     pi --model vikey/claude-3-7-sonnet");
  if (inlineKey) {
    console.log("");
    console.log(`💡 Kunci yang diberikan: ${inlineKey.slice(0, 4)}... (gunakan /login vikey)`);
  }
}

// Direct-execution guard: run only when invoked as the entry script.
const isDirectRun =
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href;

if (isDirectRun) {
  runSetupCli(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (err: unknown) => {
      console.error("❌ Setup gagal:", err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
    },
  );
}