// Regenerates the built-in blocklist from upstream.
// Usage: pnpm generate [sha]  (defaults to the latest commit on upstream's main branch)
import { writeFile } from "node:fs/promises";
import { renderBlocklistModule } from "./blocklist-module.ts";
import {
  BUILT_IN_BLOCKLIST_MODULE,
  fetchUpstreamBlocklist,
} from "./upstream.ts";

const { sha, text } = await fetchUpstreamBlocklist(process.argv[2]);
await writeFile(BUILT_IN_BLOCKLIST_MODULE, renderBlocklistModule(text, sha));
console.log(`Built-in blocklist generated from upstream@${sha}`);
