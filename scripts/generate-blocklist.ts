// Regenerates the built-in blocklist from upstream.
// Usage: pnpm generate [sha]  (defaults to the latest commit on upstream's main branch)
import { writeFile } from "node:fs/promises";
import { renderBlocklistModule } from "./blocklist-module.ts";

const REPO = "disposable-email-domains/disposable-email-domains";
const OUTPUT = new URL("../src/generated/blocklist.ts", import.meta.url);

async function fetchText(
  url: string,
  headers: Record<string, string> = {},
): Promise<string> {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status}`);
  return response.text();
}

const sha =
  process.argv[2] ??
  (await fetchText(`https://api.github.com/repos/${REPO}/commits/main`, {
    accept: "application/vnd.github.sha",
  }));

if (!/^[0-9a-f]{40}$/.test(sha))
  throw new Error(`Not a full commit SHA: ${sha}`);

const upstream = await fetchText(
  `https://raw.githubusercontent.com/${REPO}/${sha}/disposable_email_blocklist.conf`,
);
await writeFile(OUTPUT, renderBlocklistModule(upstream, sha));
console.log(`Built-in blocklist generated from ${REPO}@${sha}`);
