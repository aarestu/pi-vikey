# pi-vikey — Ekstensi Vikey.ai untuk Pi Coding Agent

[![npm version](https://img.shields.io/npm/v/pi-vikey)](https://www.npmjs.com/package/pi-vikey)

Ekstensi resmi untuk menghubungkan **Pi Coding Agent** ([pi.dev](https://pi.dev)) dengan **Vikey.ai** — AI inference gateway dengan pembayaran lokal Indonesia (QRIS/IDR).

Dengan ekstensi ini, Anda bisa mengakses model LLM unggulan langsung dari Pi CLI:

| Provider | Model Unggulan |
|----------|---------------|
| 🟣 Anthropic | Claude 3.7 Sonnet, Claude 3.5 Sonnet/Haiku |
| 🔵 DeepSeek | DeepSeek R1 (Reasoner), DeepSeek V3 |
| 🟢 OpenAI | GPT-4o, GPT-4o-mini, o3-mini, o1 |
| 🔴 Google | Gemini 2.0 Flash, Gemini 2.0 Pro |
| 🟡 Open Source | Qwen 2.5 Coder 32B, Llama 3.3 70B |

> 🌐 **Website:** [https://vikey.ai/](https://vikey.ai/)
> 
> 📖 **Dokumentasi API:** [https://api.vikey.ai/docs](https://api.vikey.ai/docs)

---

## Daftar Isi

- [Persyaratan](#persyaratan)
- [Instalasi Cepat](#instalasi-cepat)
- [Setup API Key](#setup-api-key)
- [Verifikasi](#verifikasi)
- [Penggunaan](#penggunaan)
- [Perintah Interaktif](#perintah-interaktif)
- [Struktur Proyek](#struktur-proyek)
- [Instalasi Manual](#instalasi-manual)
- [Pengembangan](#pengembangan)
- [FAQ](#faq)

---

## Persyaratan

- **Pi Coding Agent** (`>= 0.85.0`) — [Install Pi](https://pi.dev)
- **Node.js** `>= 18` (untuk script setup CLI)
- **API Key Vikey.ai** — Daftar di [vikey.ai](https://vikey.ai/) → Dashboard → API Keys

---

## Instalasi Cepat

### Opsi A: Via npm (Direkomendasikan)

```bash
# Install global
npm install -g pi-vikey

# Setup provider (opsional — ekstensi sudah auto-register saat dipasang)
pi-vikey setup

# Set API key (satu pintu)
pi            # buka TUI
/login vikey  # tempel API key -> tersimpan di ~/.pi/agent/auth.json
```

### Opsi B: Manual (Clone / Download)

```bash
# Clone repositori
git clone https://github.com/aarestu/pi-vikey.git
cd pi-vikey

# Install dependensi
npm install

# Build
npm run build

# Jalankan setup
node scripts/setup.js

# Atau langsung ke .pi/extensions (global)
cp -r dist ~/.pi/agent/extensions/pi-vikey

# Set API key (satu pintu) — di dalam pi:
#   /login vikey
```

### Opsi C: Ekstensi Global Pi

```bash
# Clone repo
git clone https://github.com/aarestu/pi-vikey.git
cd pi-vikey
npm install && npm run build

# Pasang sebagai ekstensi global Pi
mkdir -p ~/.pi/agent/extensions/pi-vikey
cp -r dist/* ~/.pi/agent/extensions/pi-vikey/

# Atau symlink untuk development
ln -s "$(pwd)" ~/.pi/agent/extensions/pi-vikey
```

Kemudian restart Pi atau ketik `/reload`.

---

## Setup API Key

**Cara utama — satu pintu lewat `/login vikey`:**

```bash
pi            # buka Pi TUI
/login vikey  # pilih provider vikey, lalu tempel API key Anda
```

Kredensial tersimpan otomatis di `~/.pi/agent/auth.json` dan langsung dipakai oleh
provider, perintah `/vikey*`, dan refresh daftar model. **Tidak perlu environment variable.**

```bash
# Verifikasi kredensial tersimpan
pi auth check --provider vikey

# Ganti / hapus kredensial
/login vikey   # jalankan lagi untuk mengganti
/logout vikey  # hapus kredensial
```

### Alternatif (headless / CI)

Environment variable tetap didukung sebagai **fallback**, dipakai hanya jika belum
ada kredensial tersimpan dari `/login`:

```bash
# Linux / macOS
export VIKEY_API_KEY="sk-vikey-..."

# Windows (PowerShell)
$env:VIKEY_API_KEY="sk-vikey-..."
```

Urutan prioritas: **kredensial `/login vikey` → `VIKEY_API_KEY` → `OPENAI_API_KEY`**.

---

## Verifikasi

```bash
# Cek koneksi ke Vikey.ai
node scripts/test-connection.js

# Atau lewat Pi
pi --model vikey/gpt-4o -p "Halo, siapa kamu?"

# Cek daftar model dari Pi
pi -e ./dist/index.js --list-models | grep vikey
```

Jika berhasil, Anda akan melihat daftar model yang tersedia dari Vikey.ai.

---

## Penggunaan

### Memilih Model

```bash
# Lewat CLI argument
pi --model vikey/claude-3-7-sonnet

# Lewat TUI — tekan Ctrl+P atau ketik /model, lalu pilih Vikey.ai
```

### Mode Reasoning

Model dengan dukungan reasoning (Claude 3.7 Sonnet, DeepSeek R1, o3-mini, o1):

```bash
# Default (low reasoning)
pi --model vikey/claude-3-7-sonnet

# Medium reasoning
pi --model vikey/deepseek-reasoner
```

---

## Perintah Interaktif

Di dalam TUI Pi (`pi` tanpa argumen), ketik:

| Perintah | Deskripsi |
|----------|-----------|
| `/vikey` | Info status ekstensi & API key |
| `/vikey-models` | Daftar model **live dari API** Vikey.ai |
| `/vikey-test` | Tes koneksi & latensi ke Vikey.ai |
| `/vikey-usage` | Pemakaian API key: request, token & total biaya |
| `/vikey-setup` | Setup otomatis models.json |

### Pemakaian vs Saldo

```bash
/vikey-usage          # atau: npm run usage
```

Menampilkan (dari API, memakai API key):

```
# Pemakaian Vikey.ai (API key)

**Key aktif ini:**
• Total request: 0 (sukses 0, gagal 0)
• Token: 0 (input 0 / output 0)
• Total biaya: 0

**API key akun ini (3):**
| Nama | Key | Pemakaian | Limit | Status |
| localku | `vk-f...a07b` | 363 | ∞ | aktif |
| sunahmuslim | `vk-e...fec6` | 2.686 | ∞ | aktif |
| restu-pc ← aktif | `vk-2...4a7e` | 0 | ∞ | aktif |
```

> ⚠️ **Saldo akun tidak bisa dibaca dengan API key.** Endpoint saldo Vikey
> (`https://app.vikey.ai/api/user/billing`) hanya menerima *access token dashboard*
> (hasil login web), bukan API key. Untuk melihat saldo, buka dashboard Vikey.

### Contoh Output `/vikey`

```
✨ Vikey.ai Provider Extension for Pi Coding Agent

• Base URL: https://api.vikey.ai/v1
• API Key Status: ✅ Terdeteksi (sk-v...ABCd)
• Total Model Terdaftar: 15 model
• Path models.json: C:\Users\user\.pi\agent\models.json

Perintah yang tersedia:
• /vikey-models — Daftar model live dari API Vikey.ai
• /vikey-test   — Menguji koneksi & latensi ke server Vikey.ai
• /vikey-usage  — Pemakaian, token & biaya API key
• /vikey-setup  — Otomatis sinkronisasi model ke ~/.pi/agent/models.json

Contoh penggunaan model langsung:
• pi --model vikey/claude-3-7-sonnet
• pi --model vikey/deepseek-reasoner
• pi --model vikey/gpt-4o
```

---

## Struktur Proyek

```
pi-vikey/
├── package.json               # Package manifest (bin → dist/bin/cli.js)
├── tsconfig.json              # TypeScript config (build)
├── tsconfig.test.json         # TypeScript config (type-check tests)
├── vitest.config.ts           # Vitest config (unit tests + coverage)
├── src/
│   ├── index.ts               # Composition root — registrasi provider & commands
│   ├── catalog/               # Katalog model (single source of truth)
│   │   ├── types.ts           #   Tipe domain (VikeyModelDefinition, dll)
│   │   ├── catalog.ts         #   Data katalog + konstanta provider
│   │   ├── provider.ts        #   buildProviderConfig() → models.json / registerProvider
│   │   └── format.ts          #   Render markdown daftar model
│   ├── config/                # Konfigurasi
│   │   ├── apiKey.ts          #   API key: /login vikey (auth.json) + env fallback
│   │   ├── paths.ts           #   Path models.json (global / project)
│   │   └── modelsJson.ts      #   Read/write/merge models.json
│   ├── api/                   # HTTP client
│   │   ├── client.ts          #   testVikeyConnection (fetch injectable)
│   │   ├── models-fetch.ts    #   fetchRemoteModelIds — GET /v1/models live
│   │   └── refresh.ts         #   refreshModels handler (live + persist + fallback)
│   ├── commands/              # Handler perintah murni + wiring pi
│   │   ├── status.ts          #   /vikey
│   │   ├── list.ts            #   /vikey-models
│   │   ├── test.ts            #   /vikey-test
│   │   ├── usage.ts           #   /vikey-usage
│   │   ├── setup.ts           #   /vikey-setup
│   │   └── register.ts        #   Registrasi ke pi.registerCommand
│   ├── cli/                   # CLI mandiri (TS, dikompilasi ke dist)
│   │   ├── args.ts            #   Parse argumen (murni)
│   │   ├── setup.ts           #   npm run setup
│   │   ├── test-connection.ts #   npm run test:conn
│   │   └── usage.ts           #   npm run usage
│   └── bin/                   # Executable `pi-vikey`
│       └── cli.ts             #   Dispatch setup|test
├── tests/
│   └── unit/                  # Unit test (terpisah dari src, mirror struktur)
│       ├── api/               #   client.test.ts
│       ├── catalog/           #   catalog / provider / format
│       ├── cli/               #   args
│       ├── commands/          #   status / test / setup
│       ├── config/            #   apiKey / paths / modelsJson
│       └── util/              #   mask
├── scripts/
│   ├── setup.js               # Shim → dist/cli/setup.js (backward-compat)
│   ├── test-connection.js     # Shim → dist/cli/test-connection.js
│   └── generate-example.js    # Regenerasi models.example.json dari katalog
├── models.example.json        # Template konfigurasi (dihasilkan otomatis)
├── README.md                  # Dokumentasi (Indonesia)
└── README.en.md               # Dokumentasi (English)
```

### Arsitektur & Prinsip

- **Single Responsibility** — setiap modul punya satu alasan untuk berubah:
  data katalog, mapping provider, HTTP/client, persistence, presentasi, dan wiring dipisah.
- **Daftar model live dari API** — daftar efektif diambil dari `GET /v1/models` via
  `refreshModels`; katalog statis hanya fallback + sumber enrichment metadata.
- **Single Source of Truth** — katalog statis hanya di `src/catalog/catalog.ts`;
  `registerProvider`, `models.json`, dan `models.example.json` semuanya diturunkan
  dari sana (lihat `npm run generate:example`).
- **Dependency Injection** — handler/CLI menerima dependensi (fetch, persist,
  tester) yang bisa di-stub di unit test.
- **Errors as values** — hasil operasi I/O dikembalikan sebagai `Result` terstruktur,
  tidak melempar exception untuk alur normal.

### Cara Kerja Daftar Model (Live dari API)

1. **Buka `pi` (TUI)** → background refresh: `GET /v1/models` → daftar menggantikan
   katalog statis → snapshot disimpan ke `~/.pi/agent/models-store.json`.
2. **Sesi berikutnya / `--list-models`** → fase offline: snapshot terakhir di-restore
   tanpa fetch.
3. **Model baru di gateway** muncul otomatis tanpa update ekstensi (heuristik metadata:
   context window default 128k/16k; reasoning terdeteksi dari pola id seperti `r1`,
   `o3`, `reasoner`, `thinking`).
4. **Katalog statis** hanya dipakai saat offline pertama kali atau API gagal.
5. **Kredensial**: pi memprioritaskan credential tersimpan (`/login`), lalu env
   `VIKEY_API_KEY`.

---

## Instalasi Manual (Tanpa Ekstensi)

Jika tidak ingin menggunakan ekstensi, Anda bisa langsung mengedit `~/.pi/agent/models.json` secara manual dengan isi dari `models.example.json`.

1. Buka `~/.pi/agent/models.json` (buat jika belum ada)
2. Tambahkan konfigurasi provider `vikey` (lihat `models.example.json`)
3. Set `VIKEY_API_KEY` environment variable
4. Restart Pi

---

## Pengembangan

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

# Type-check (src + tests)
npm run typecheck

# Jalankan unit test
npm test

# Unit test + laporan coverage
npm run test:coverage

# Test dengan Pi langsung
pi -e ./dist/index.js

# Test connection
npm run test:conn

# Regenerasi models.example.json dari katalog
npm run generate:example
```

### Menambahkan Model Baru

Edit `src/catalog/catalog.ts` dan tambahkan entri baru ke array `VIKEY_MODEL_CATALOG`:

```typescript
{
  id: "model-id-baru",
  name: "Nama Model Baru",
  category: "openai",
  contextWindow: 128000,
  maxTokens: 16384,
  input: ["text"],
  reasoning: false,
  recommended: false,
  description: "Deskripsi model."
}
```

Kemudian:

```bash
npm run build
npm run generate:example   # sinkronkan models.example.json
npm test                   # pastikan tes katalog tetap hijau
```

---

## FAQ

**Q: Apa itu Vikey.ai?**

Vikey.ai adalah AI inference gateway yang menyediakan akses ke berbagai model LLM (Claude, GPT, DeepSeek, Gemini, Qwen) dengan endpoint OpenAI-compatible dan pembayaran lokal Indonesia (QRIS/IDR).

**Q: Berapa biaya penggunaan?**

Lihat harga terbaru di [https://vikey.ai/pricing](https://vikey.ai/pricing).

**Q: Bagaimana cara mendapatkan API Key?**

Daftar di [vikey.ai](https://vikey.ai/) → Dashboard → API Keys → Buat API Key baru.

**Q: Bisa pakai OPENAI_API_KEY?**

Ya. Jika `VIKEY_API_KEY` tidak diset, ekstensi akan mencari `OPENAI_API_KEY` sebagai fallback.

**Q: Model tidak muncul di menu /model?**

Pastikan `VIKEY_API_KEY` sudah diset dengan benar dan jalankan `/reload` di Pi.

---

## Lisensi

MIT — lihat file [LICENSE](./LICENSE) untuk detail.

---

## Kontribusi

Kami menyambut kontribusi! Silakan buka [issue](https://github.com/aarestu/pi-vikey/issues) atau kirim [Pull Request](https://github.com/aarestu/pi-vikey/pulls).

---

*Dibuat oleh [aarestu](https://github.com/aarestu)*