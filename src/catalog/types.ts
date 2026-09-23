/**
 * Domain types for the Vikey.ai model catalog.
 */

/** Vendor family a model belongs to (used for grouping & display). */
export type ModelCategory = "anthropic" | "deepseek" | "openai" | "google" | "opensource";

/** Modality a model accepts as input. */
export type ModelInput = "text" | "image";

/** OpenAI-compatibility flags advertised per model (or provider). */
export interface VikeyCompat {
  readonly supportsDeveloperRole?: boolean;
  readonly supportsReasoningEffort?: boolean;
}

/**
 * A single entry in the curated Vikey.ai catalog.
 * All fields are readonly: the catalog is treated as immutable data.
 */
export interface VikeyModelDefinition {
  /** Model id as accepted by the Vikey.ai API (e.g. "claude-3-7-sonnet"). */
  readonly id: string;
  /** Human-readable display name. */
  readonly name: string;
  /** Vendor family used for grouping. */
  readonly category: ModelCategory;
  /** Context window size in tokens. */
  readonly contextWindow: number;
  /** Maximum output tokens. */
  readonly maxTokens: number;
  /** Accepted input modalities. */
  readonly input: ReadonlyArray<ModelInput>;
  /** Whether the model natively supports reasoning/thinking. */
  readonly reasoning?: boolean;
  /** Whether the model is featured/recommended in UI output. */
  readonly recommended?: boolean;
  /** Short description shown in documentation. */
  readonly description?: string;
  /** OpenAI-compatibility flags for this specific model. */
  readonly compat?: VikeyCompat;
}