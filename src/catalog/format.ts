/**
 * Presentation layer for the catalog: renders the model list as
 * markdown for the `/vikey-models` command. Pure function — no I/O.
 */

import { VIKEY_DEFAULT_BASE_URL, VIKEY_MODEL_CATALOG } from "./catalog.js";
import type { ModelCategory, VikeyModelDefinition } from "./types.js";

/** Human-readable headers for each category, in display order. */
export const CATEGORY_LABELS: Readonly<Record<ModelCategory, string>> = {
  anthropic: "🟣 Anthropic Claude",
  deepseek: "🔵 DeepSeek",
  openai: "🟢 OpenAI",
  google: "🔴 Google Gemini",
  opensource: "🟡 Open Source & Coding Specialists",
};

/** Pretty-printed context window, e.g. `200k`, `1M`. */
export function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) {
    const millions = tokens / 1_000_000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
  }
  return `${Math.round(tokens / 1_000)}k`;
}

/** Pretty-printed max output, e.g. `64k`. */
export function formatMaxTokens(tokens: number): string {
  return `${Math.round(tokens / 1_000)}k`;
}

/**
 * Render the catalog as a markdown table grouped by category.
 * Defaults to the full curated catalog but accepts any subset
 * (e.g. only recommended models) for flexibility.
 */
export function formatModelsListMarkdown(
  catalog: ReadonlyArray<VikeyModelDefinition> = VIKEY_MODEL_CATALOG,
): string {
  const lines: string[] = [
    "# Model Vikey.ai yang Tersedia",
    "",
    `Base URL: \`${VIKEY_DEFAULT_BASE_URL}\``,
    "",
  ];

  const groups = groupByCategory(catalog);
  for (const [category, models] of groups) {
    if (models.length === 0) continue;
    lines.push(`### ${CATEGORY_LABELS[category]}`, "");
    lines.push("| Model ID | Nama Model | Context | Max Output | Rekomendasi |");
    lines.push("| :--- | :--- | :--- | :--- | :--- |");
    for (const model of models) {
      lines.push(
        [
          `| \`${model.id}\``,
          model.name,
          formatContextWindow(model.contextWindow),
          formatMaxTokens(model.maxTokens),
          model.recommended === true ? "⭐ Ya" : "-",
          "|",
        ].join(" | "),
      );
    }
    lines.push("");
  }

  lines.push(
    "> Cara memilih model di Pi CLI: `pi --model vikey/<model-id>` atau ketik `/model` di TUI.",
  );
  return lines.join("\n");
}

/**
 * Render the live (API-fetched) model list as a flat markdown table.
 * Remote models are not grouped by category — the gateway returns a flat list.
 */
export function formatRemoteModelsMarkdown(
  models: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly contextWindow: number;
    readonly maxTokens: number;
    readonly reasoning?: boolean;
  }>,
): string {
  const lines: string[] = [
    "# Model Vikey.ai (live dari API)",
    "",
    `Total: **${models.length} model** — diambil dari \`${VIKEY_DEFAULT_BASE_URL}/models\``,
    "",
    "| Model ID | Nama | Context | Max Output | Reasoning |",
    "| :--- | :--- | :--- | :--- | :--- |",
  ];
  for (const model of models) {
    lines.push(
      [
        `| \`${model.id}\``,
        model.name,
        formatContextWindow(model.contextWindow),
        formatMaxTokens(model.maxTokens),
        model.reasoning === true ? "✓" : "-",
        "|",
      ].join(" | "),
    );
  }
  lines.push(
    "",
    "> Daftar ini diambil langsung dari API Vikey.ai. Ketik `/model` di TUI untuk memilih.",
  );
  return lines.join("\n");
}

function groupByCategory(
  catalog: ReadonlyArray<VikeyModelDefinition>,
): ReadonlyMap<ModelCategory, ReadonlyArray<VikeyModelDefinition>> {
  const groups = new Map<ModelCategory, VikeyModelDefinition[]>();
  for (const model of catalog) {
    const bucket = groups.get(model.category) ?? [];
    bucket.push(model);
    groups.set(model.category, bucket);
  }
  return groups;
}