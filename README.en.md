# pi-vikey — Vikey.ai Extension for Pi Coding Agent

[![npm version](https://img.shields.io/npm/v/@aarestu/pi-vikey)](https://www.npmjs.com/package/@aarestu/pi-vikey)

Official extension to connect **Pi Coding Agent** ([pi.dev](https://pi.dev)) with **Vikey.ai** — an AI inference gateway with local Indonesian payment support (QRIS/IDR).

Access leading LLM models directly from Pi CLI:

| Provider | Featured Models |
|----------|----------------|
| 🟣 Anthropic | Claude 3.7 Sonnet, Claude 3.5 Sonnet/Haiku |
| 🔵 DeepSeek | DeepSeek R1 (Reasoner), DeepSeek V3 |
| 🟢 OpenAI | GPT-4o, GPT-4o-mini, o3-mini, o1 |
| 🔴 Google | Gemini 2.0 Flash, Gemini 2.0 Pro |
| 🟡 Open Source | Qwen 2.5 Coder 32B, Llama 3.3 70B |

> 🌐 **Website:** [https://vikey.ai/](https://vikey.ai/)
> 
> 📖 **API Docs:** [https://api.vikey.ai/docs](https://api.vikey.ai/docs)

---

## Table of Contents

- [Requirements](#requirements)
- [Quick Install](#quick-install)
- [API Key Setup](#api-key-setup)
- [Verification](#verification)
- [Usage](#usage)
- [Interactive Commands](#interactive-commands)
- [Project Structure](#project-structure)
- [Manual Installation](#manual-installation)
- [Development](#development)
- [FAQ](#faq)

---

## Requirements

- **Pi Coding Agent** (`>= 0.85.0`) — [Install Pi](https://pi.dev)
- **Node.js** `>= 18`
- **Vikey.ai API Key** — Sign up at [vikey.ai](https://vikey.ai/) → Dashboard → API Keys

---

## Quick Install

### Option A: via npm (Recommended)

```bash
# Install globally
npm install -g @aarestu/pi-vikey

# Provider setup (optional — the extension auto-registers once installed)
pi-vikey setup

# Set your API key (single door)
pi            # open the TUI
/login vikey  # paste the API key -> stored in ~/.pi/agent/auth.json
```

### Option B: Manual (Clone / Download)

```bash
# Clone repository
git clone https://github.com/aarestu/pi-vikey.git
cd pi-vikey

# Install dependencies
npm install

# Build
npm run build

# Run setup
node scripts/setup.js

# Or copy as a global Pi extension
cp -r dist ~/.pi/agent/extensions/pi-vikey

# Set your API key (single door) — inside pi:
#   /login vikey
```

### Option C: Global Pi Extension

```bash
git clone https://github.com/aarestu/pi-vikey.git
cd pi-vikey
npm install && npm run build

# Install as global Pi extension
mkdir -p ~/.pi/agent/extensions/pi-vikey
cp -r dist/* ~/.pi/agent/extensions/pi-vikey/

# Or symlink for development
ln -s "$(pwd)" ~/.pi/agent/extensions/pi-vikey
```

Then restart Pi or type `/reload`.

---

## API Key Setup

**Primary — one door via `/login vikey`:**

```bash
pi            # open the Pi TUI
/login vikey  # pick the vikey provider, then paste your API key
```

The credential is stored in `~/.pi/agent/auth.json` and used by the provider,
the `/vikey*` commands, and model-list refreshes. **No environment variable needed.**

```bash
# Verify the stored credential
pi auth check --provider vikey

# Replace / remove it
/login vikey   # run again to replace
/logout vikey  # remove the credential
```

### Alternative (headless / CI)

Environment variables are still supported as a **fallback**, used only when no
stored `/login` credential exists:

```bash
# Linux / macOS
export VIKEY_API_KEY="sk-vikey-..."

# Windows (PowerShell)
$env:VIKEY_API_KEY="sk-vikey-..."
```

Priority order: **`/login vikey` credential → `VIKEY_API_KEY` → `OPENAI_API_KEY`**.

---

## Verification

```bash
# Test connection to Vikey.ai
node scripts/test-connection.js

# Or via Pi
pi --model vikey/gpt-4o -p "Hello, who are you?"

# List models from Pi
pi --list-models | grep vikey
```

---

## Usage

### Selecting a Model

```bash
# Via CLI argument
pi --model vikey/claude-3-7-sonnet

# Via TUI — press Ctrl+P or type /model, then select Vikey.ai
```

### Reasoning Models

Models with reasoning support (Claude 3.7 Sonnet, DeepSeek R1, o3-mini, o1):

```bash
# Default (low reasoning)
pi --model vikey/claude-3-7-sonnet

# Medium reasoning
pi --model vikey/deepseek-reasoner
```

---

## Interactive Commands

Inside Pi TUI (`pi` with no arguments), type:

| Command | Description |
|---------|-------------|
| `/vikey` | Extension & API key status info |
| `/vikey-models` | Model list **fetched live from the Vikey.ai API** |
| `/vikey-test` | Test connection & latency to Vikey.ai |
| `/vikey-usage` | API key usage: requests, tokens & total cost |
| `/vikey-setup` | Auto-configure models.json |

---

## Usage vs Balance

```bash
/vikey-usage          # or: npm run usage
```

Shows (via the API, using your API key): request/token/cost counters for the
active key, plus all account API keys with their usage counts and limits.

> ⚠️ **The account balance cannot be read with an API key.** Vikey's balance
> endpoint (`https://app.vikey.ai/api/user/billing`) only accepts a *dashboard
> access token* from the web login, not an API key. Open the Vikey dashboard to
> check your balance.

## Project Structure

```
pi-vikey/
├── package.json               # Package manifest (bin → dist/bin/cli.js)
├── tsconfig.json              # TypeScript config (build)
├── tsconfig.test.json         # TypeScript config (type-check tests)
├── vitest.config.ts           # Vitest config (unit tests + coverage)
├── src/
│   ├── index.ts               # Composition root — registers provider & commands
│   ├── catalog/               # Model catalog (single source of truth)
│   │   ├── types.ts           #   Domain types (VikeyModelDefinition, etc.)
│   │   ├── catalog.ts         #   Catalog data + provider constants
│   │   ├── provider.ts        #   buildProviderConfig() → models.json / registerProvider
│   │   └── format.ts          #   Markdown rendering of the model list
│   ├── config/                # Configuration
│   │   ├── apiKey.ts          #   API key resolution (env, fallback)
│   │   ├── paths.ts           #   models.json paths (global / project)
│   │   └── modelsJson.ts      #   Read/write/merge models.json
│   ├── api/                   # HTTP client
│   │   ├── client.ts          #   testVikeyConnection (injectable fetch)
│   │   ├── models-fetch.ts    #   fetchRemoteModelIds — live GET /v1/models
│   │   ├── usage.ts           #   Usage & API keys (/v1/api-keys*)
│   │   └── refresh.ts         #   refreshModels handler (live + persist + fallback)
│   ├── commands/              # Pure command handlers + pi wiring
│   │   ├── status.ts          #   /vikey
│   │   ├── list.ts            #   /vikey-models
│   │   ├── test.ts            #   /vikey-test
│   │   ├── usage.ts           #   /vikey-usage
│   │   ├── setup.ts           #   /vikey-setup
│   │   └── register.ts        #   Registration via pi.registerCommand
│   ├── cli/                   # Standalone CLIs (TS, compiled to dist)
│   │   ├── args.ts            #   Pure argument parsing
│   │   ├── setup.ts           #   npm run setup
│   │   ├── test-connection.ts #   npm run test:conn
│   │   └── usage.ts           #   npm run usage
│   └── bin/                   # `pi-vikey` executable
│       └── cli.ts             #   Dispatch setup|test
├── tests/
│   └── unit/                  # Unit tests (separate from src, mirrors layout)
│       ├── api/               #   client / models-fetch / refresh
│       ├── catalog/           #   catalog / provider / format
│       ├── cli/               #   args
│       ├── commands/          #   status / test / setup
│       ├── config/            #   apiKey / paths / modelsJson
│       └── util/              #   mask
├── scripts/
│   ├── setup.js               # Shim → dist/cli/setup.js (backward-compat)
│   ├── test-connection.js     # Shim → dist/cli/test-connection.js
│   └── generate-example.js    # Regenerates models.example.json from the catalog
├── models.example.json        # Config template (auto-generated)
├── README.md                  # Documentation (Indonesian)
└── README.en.md               # Documentation (English)
```

### Architecture & Principles

- **Single Responsibility** — each module has one reason to change: catalog data,
  provider mapping, HTTP client, persistence, presentation, and wiring are separated.
- **Live model list from the API** — the effective list is fetched from
  `GET /v1/models` via `refreshModels`; the static catalog is only a fallback and
  the metadata-enrichment source.
- **Single Source of Truth** — static model data lives only in `src/catalog/catalog.ts`;
  `registerProvider`, `models.json` output, and `models.example.json` are all derived
  from it (see `npm run generate:example`).
- **Dependency Injection** — handlers/CLIs accept injectable dependencies (fetch,
  persistence, connection tester) so unit tests can stub them.
- **Errors as values** — I/O operations return structured `Result` objects instead
  of throwing for normal control flow.

### How the Model List Works (Live from the API)

1. **Open `pi` (TUI)** → background refresh: `GET /v1/models` → the list replaces
   the static catalog → a snapshot is saved to `~/.pi/agent/models-store.json`.
2. **Next sessions / `--list-models`** → offline phase: the last snapshot is restored
   without fetching.
3. **New gateway models** appear automatically without updating the extension
   (metadata heuristics: default 128k/16k limits; reasoning detected from id
   patterns like `r1`, `o3`, `reasoner`, `thinking`).
4. **The static catalog** is only used on first offline start or when the API fails.
5. **Credentials**: pi prefers the stored credential (`/login`), then the
   `VIKEY_API_KEY` env var.

---

## Manual Installation (Without Extension)

Edit `~/.pi/agent/models.json` directly using the contents of `models.example.json`.

1. Open `~/.pi/agent/models.json` (create if not exists)
2. Add the `vikey` provider configuration (see `models.example.json`)
3. Set the `VIKEY_API_KEY` environment variable
4. Restart Pi

---

## Development

```bash
# Clone
git clone https://github.com/aarestu/pi-vikey.git
cd pi-vikey

# Install
npm install

# Build TypeScript
npm run build

# Watch mode
npm run watch

# Test with Pi directly
pi -e ./dist/index.js

# Test connection
npm run test:conn

# API key usage & cost
npm run usage

# Type-check (src + tests)
npm run typecheck

# Run unit tests
npm test

# Unit tests + coverage report
npm run test:coverage

# Regenerate models.example.json from the catalog
npm run generate:example
```

### Adding New Models

Edit `src/catalog/catalog.ts` and add a new entry to the `VIKEY_MODEL_CATALOG` array:

```typescript
{
  id: "new-model-id",
  name: "New Model Name",
  category: "openai",
  contextWindow: 128000,
  maxTokens: 16384,
  input: ["text"],
  reasoning: false,
  recommended: false,
  description: "Model description."
}
```

Then:

```bash
npm run build
npm run generate:example   # keep models.example.json in sync
npm test                   # keep the catalog tests green
```

---

## FAQ

**Q: What is Vikey.ai?**

Vikey.ai is an AI inference gateway providing access to various LLM models (Claude, GPT, DeepSeek, Gemini, Qwen) with OpenAI-compatible endpoints and local Indonesian payment (QRIS/IDR).

**Q: How much does it cost?**

See latest pricing at [https://vikey.ai/pricing](https://vikey.ai/pricing).

**Q: How do I get an API Key?**

Sign up at [vikey.ai](https://vikey.ai/) → Dashboard → API Keys → Create New API Key.

**Q: Can I use OPENAI_API_KEY?**

Yes. If `VIKEY_API_KEY` is not set, the extension falls back to `OPENAI_API_KEY`.

**Q: Models not showing in /model menu?**

Make sure `VIKEY_API_KEY` is correctly set and run `/reload` in Pi.

---

## License

MIT — see the [LICENSE](./LICENSE) file for details.

---

## Contributing

Contributions welcome! Please open an [issue](https://github.com/aarestu/pi-vikey/issues) or submit a [Pull Request](https://github.com/aarestu/pi-vikey/pulls).

---

*Built by [aarestu](https://github.com/aarestu)*