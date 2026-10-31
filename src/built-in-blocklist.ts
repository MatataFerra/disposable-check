import { builtInBlocklist } from "./generated/blocklist.ts";

let rules: ReadonlySet<string> | undefined;

// One rule per line: the format written by scripts/blocklist-module.ts.
/** Built-in blocklist rules, parsed on first use so importing the package stays cheap. */
export function builtInRules(): ReadonlySet<string> {
  rules ??= new Set(builtInBlocklist.split("\n"));
  return rules;
}
