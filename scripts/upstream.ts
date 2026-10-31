// Downloads the upstream blocklist at a given commit, or at the latest one.
import { UPSTREAM_REPO } from "./blocklist-module.ts";

/** Where the built-in blocklist module is generated. */
export const BUILT_IN_BLOCKLIST_MODULE: URL = new URL(
  "../src/generated/blocklist.ts",
  import.meta.url,
);

async function fetchText(
  url: string,
  headers: Record<string, string> = {},
): Promise<string> {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status}`);
  return response.text();
}

export interface UpstreamBlocklist {
  sha: string;
  text: string;
}

export async function fetchUpstreamBlocklist(
  sha?: string,
): Promise<UpstreamBlocklist> {
  const commit =
    sha ??
    (await fetchText(
      `https://api.github.com/repos/${UPSTREAM_REPO}/commits/main`,
      { accept: "application/vnd.github.sha" },
    ));
  if (!/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error(`Not a full commit SHA: ${commit}`);
  }
  const text = await fetchText(
    `https://raw.githubusercontent.com/${UPSTREAM_REPO}/${commit}/disposable_email_blocklist.conf`,
  );
  return { sha: commit, text };
}
