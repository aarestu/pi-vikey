/**
 * Pure CLI argument parsing for the `setup` command.
 * Kept separate from IO so the parsing rules are unit-testable.
 */

export interface SetupArgs {
  /** `--test` — validate and preview without writing. */
  test: boolean;
  /** `--project` — target the current project's `.pi/models.json`. */
  project: boolean;
  /** `--key <key>` — inline key (only used to print a tip). */
  key?: string;
  /** `--output <file>` — explicit target path. */
  output?: string;
  /** `--help` — print usage instead of running. */
  help: boolean;
}

/** Parse raw argv (excluding node + script) into a typed descriptor. */
export function parseSetupArgs(argv: ReadonlyArray<string>): SetupArgs {
  const args: SetupArgs = {
    test: false,
    project: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--test":
        args.test = true;
        break;
      case "--project":
        args.project = true;
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      case "--key":
        args.key = argv[i + 1];
        i += 1;
        break;
      case "--output":
        args.output = argv[i + 1];
        i += 1;
        break;
      default:
        // Unknown flags are ignored for forward compatibility.
        break;
    }
  }

  return args;
}