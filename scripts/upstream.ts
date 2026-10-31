// Downloads the upstream blocklist at a given commit, or at the latest one.
import { UPSTREAM_REPO } from "./blocklist-module.ts";

/** Where the built-in blocklist module is generated. */
export const BUILT_IN_BLOCKLIST_MODULE: URL = new URL(
  "../src/generated/blocklist.ts",
  import.meta.url,
);

// The list is about 160 KB; anything far bigger isn't the list.
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;
const TIMEOUT_MS = 30_000;

async function fetchText(
  url: string,
  headers: Record<string, string> = {},
): Promise<string> {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status}`);
  if (Number(response.headers.get("content-length")) > MAX_RESPONSE_BYTES) {
    throw new Error(
      `GET ${url}: response larger than ${MAX_RESPONSE_BYTES} bytes`,
    );
  }
  const body = await response.arrayBuffer();
  if (body.byteLength > MAX_RESPONSE_BYTES) {
    throw new Error(
      `GET ${url}: response larger than ${MAX_RESPONSE_BYTES} bytes`,
    );
  }
  return new TextDecoder().decode(body);
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
