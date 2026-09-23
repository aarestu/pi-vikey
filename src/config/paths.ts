/**
 * Filesystem path resolution for pi configuration locations.
 * Pure path logic only — no filesystem access.
 */

import * as os from "node:os";
import * as path from "node:path";

/** Default global pi config path: `~/.pi/agent/models.json`. */
export function getPiModelsJsonPath(homedir: string = os.homedir()): string {
  return path.join(homedir, ".pi", "agent", "models.json");
}

/** Project-local pi config path: `<cwd>/.pi/models.json`. */
export function getProjectModelsPath(cwd: string): string {
  return path.join(cwd, ".pi", "models.json");
}