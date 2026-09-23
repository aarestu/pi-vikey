/**
 * Display helpers shared across commands and scripts.
 */

/** Mask a secret for display, e.g. `sk-vi...aBcD`. */
export function maskApiKey(key: string | undefined): string {
  if (!key) return "Belum diatur (jalankan /login vikey)";
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}