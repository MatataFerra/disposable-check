// Syncs the built-in blocklist with the latest upstream commit, for the weekly
// sync workflow. When the domains changed, it rewrites the built-in blocklist,
// writes a patch changeset and the PR body; otherwise it changes nothing.
// Usage: pnpm sync-blocklist <pr-body-file>
// Sets `changed` and `title` in $GITHUB_OUTPUT when running on GitHub Actions.
import { appendFile, readFile, writeFile } from "node:fs/promises";
import {
  describeBlocklistChange,
  renderSyncPullRequest,
} from "./blocklist-change.ts";
import { renderBlocklistModule } from "./blocklist-module.ts";
import {
  BUILT_IN_BLOCKLIST_MODULE,
  fetchUpstreamBlocklist,
} from "./upstream.ts";

const bodyFile = process.argv[2];
if (bodyFile === undefined) {
  throw new Error("Usage: sync-blocklist <pr-body-file>");
}

async function setOutput(values: Record<string, string>): Promise<void> {
  const file = process.env.GITHUB_OUTPUT;
  if (file === undefined) return;
  const lines = Object.entries(values).map(
    ([key, value]) => `${key}=${value}\n`,
  );
  await appendFile(file, lines.join(""));
}

const previous = await readFile(BUILT_IN_BLOCKLIST_MODULE, "utf8");
const { sha, text } = await fetchUpstreamBlocklist();
const next = renderBlocklistModule(text, sha);
const change = describeBlocklistChange(previous, next);

if (change === null) {
  console.log(`No domain changes up to upstream@${sha}.`);
  await setOutput({ changed: "false" });
} else {
  const { title, body, changesetFile, changeset } =
    renderSyncPullRequest(change);
  await writeFile(BUILT_IN_BLOCKLIST_MODULE, next);
  await writeFile(
    new URL(`../.changeset/${changesetFile}`, import.meta.url),
    changeset,
  );
  await writeFile(bodyFile, body);
  console.log(title);
  await setOutput({ changed: "true", title });
}
