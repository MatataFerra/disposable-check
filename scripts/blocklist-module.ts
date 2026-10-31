// The format of the generated built-in blocklist module: written here and read
// back here, so the format lives in one place.
import { toCanonicalDomain } from "../src/canonical-domain.ts";

export const UPSTREAM_REPO =
  "disposable-email-domains/disposable-email-domains";

/**
 * Turns the upstream `disposable_email_blocklist.conf` into the source of the
 * built-in blocklist module. Pure so the output is reproducible for a given SHA.
 *
 * Each entry is read like a custom rule: an entry that isn't a domain (a bare
 * TLD, stray markup) is left out, so upstream data can never become a rule
 * that blocks a whole TLD.
 */
export function renderBlocklistModule(upstream: string, sha: string): string {
  const domains = new Set<string>();
  for (const line of upstream.split("\n")) {
    if (line.trim().startsWith("#")) continue;
    const domain = toCanonicalDomain(line);
    if (domain !== null) domains.add(domain);
  }

  return [
    "// DO NOT EDIT. Generated from upstream by `pnpm generate` or the weekly sync:",
    `// https://github.com/${UPSTREAM_REPO}/tree/${sha}`,
    `// (disposable-email-domains@${sha}, CC0 1.0).`,
    "",
    `export const builtInBlocklist: string = ${JSON.stringify([...domains].sort().join("\n"))};`,
    "",
  ].join("\n");
}

export interface BlocklistSnapshot {
  sha: string;
  domains: ReadonlySet<string>;
}

/** Reads back a module written by renderBlocklistModule. */
export function readBlocklistModule(module: string): BlocklistSnapshot {
  const sha = /disposable-email-domains@([0-9a-f]{40})/.exec(module)?.[1];
  const list = /export const builtInBlocklist: string = (".*");/.exec(
    module,
  )?.[1];
  if (sha === undefined || list === undefined) {
    throw new Error("Not a built-in blocklist module");
  }
  return { sha, domains: new Set((JSON.parse(list) as string).split("\n")) };
}
