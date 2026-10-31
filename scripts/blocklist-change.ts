/**
 * What changed between two snapshots of the built-in blocklist, and the PR and
 * changeset that release it. Pure so the sync workflow's decisions can be tested.
 */
import { readBlocklistModule, UPSTREAM_REPO } from "./blocklist-module.ts";

export interface BlocklistChange {
  fromSha: string;
  toSha: string;
  added: string[];
  removed: string[];
}

/**
 * The domains added and removed between two built-in blocklist modules, or
 * `null` when the domains are the same, even if upstream moved to another commit.
 */
export function describeBlocklistChange(
  previousModule: string,
  nextModule: string,
): BlocklistChange | null {
  const previous = readBlocklistModule(previousModule);
  const next = readBlocklistModule(nextModule);
  const added = [...next.domains].filter((d) => !previous.domains.has(d));
  const removed = [...previous.domains].filter((d) => !next.domains.has(d));
  if (added.length === 0 && removed.length === 0) return null;
  return {
    fromSha: previous.sha,
    toSha: next.sha,
    added: added.sort(),
    removed: removed.sort(),
  };
}

const MAX_LISTED_DOMAINS = 100;

export interface SyncPullRequest {
  title: string;
  body: string;
  /** File name inside `.changeset/`, unique per upstream commit. */
  changesetFile: string;
  changeset: string;
}

const shortSha = (sha: string) => sha.slice(0, 7);

const domainCount = (count: number) =>
  `${count} ${count === 1 ? "domain" : "domains"}`;

function domainList(domains: readonly string[]): string {
  if (domains.length === 0) return "_None._";
  const listed = domains.slice(0, MAX_LISTED_DOMAINS).map((d) => `- \`${d}\``);
  const hidden = domains.length - listed.length;
  return [...listed, ...(hidden > 0 ? [`- …and ${hidden} more`] : [])].join(
    "\n",
  );
}

/** The PR title and body, and the patch changeset, for a blocklist change (ADR-0002). */
export function renderSyncPullRequest(
  change: BlocklistChange,
): SyncPullRequest {
  const { fromSha, toSha, added, removed } = change;
  const changeset = [
    "---",
    '"disposable-check": patch',
    "---",
    "",
    `Update the built-in blocklist to disposable-email-domains@${shortSha(toSha)}: ${domainCount(added.length)} added, ${removed.length} removed.`,
    "",
  ].join("\n");

  const body = [
    `Syncs the built-in blocklist with upstream: **${added.length}** added, **${removed.length}** removed.`,
    "",
    `Upstream: [\`${shortSha(fromSha)}...${shortSha(toSha)}\`](https://github.com/${UPSTREAM_REPO}/compare/${fromSha}...${toSha})`,
    "",
    `### Added (${added.length})`,
    "",
    domainList(added),
    "",
    `### Removed (${removed.length})`,
    "",
    domainList(removed),
    "",
    "Merging this PR releases a patch version through the Version Packages PR.",
    "",
  ].join("\n");

  return {
    title: `Update built-in blocklist (+${added.length}, -${removed.length})`,
    body,
    changesetFile: `sync-blocklist-${shortSha(toSha)}.md`,
    changeset,
  };
}
