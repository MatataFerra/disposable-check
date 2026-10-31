import { describe, expect, it } from "vitest";
import {
  describeBlocklistChange,
  renderSyncPullRequest,
} from "../scripts/blocklist-change.ts";
import { renderBlocklistModule } from "../scripts/blocklist-module.ts";

const OLD_SHA = "1111111111111111111111111111111111111111";
const NEW_SHA = "2222222222222222222222222222222222222222";

const snapshot = (domains: string[], sha: string) =>
  renderBlocklistModule(domains.join("\n"), sha);

describe("describeBlocklistChange", () => {
  it("reports no change when upstream moved but the domains are the same", () => {
    expect(
      describeBlocklistChange(
        snapshot(["a.com", "b.com"], OLD_SHA),
        snapshot(["b.com", "a.com"], NEW_SHA),
      ),
    ).toBeNull();
  });

  it("lists added and removed domains, and both upstream commits", () => {
    expect(
      describeBlocklistChange(
        snapshot(["a.com", "b.com", "c.com"], OLD_SHA),
        snapshot(["b.com", "d.com", "c.com", "e.com"], NEW_SHA),
      ),
    ).toEqual({
      fromSha: OLD_SHA,
      toSha: NEW_SHA,
      added: ["d.com", "e.com"],
      removed: ["a.com"],
    });
  });

  it("rejects a file that isn't a generated blocklist module", () => {
    expect(() =>
      describeBlocklistChange("export {};", snapshot(["a.com"], NEW_SHA)),
    ).toThrow("Not a built-in blocklist module");
  });
});

describe("renderSyncPullRequest", () => {
  const change = {
    fromSha: OLD_SHA,
    toSha: NEW_SHA,
    added: ["d.com", "e.com"],
    removed: ["a.com"],
  };

  it("names the changeset after the upstream commit, so pending syncs don't overwrite each other", () => {
    expect(renderSyncPullRequest(change).changesetFile).toBe(
      "sync-blocklist-2222222.md",
    );
  });

  it("writes a patch changeset that counts the change and names the upstream commit", () => {
    expect(renderSyncPullRequest(change).changeset).toBe(
      `---
"disposable-check": patch
---

Update the built-in blocklist to disposable-email-domains@2222222: 2 domains added, 1 removed.
`,
    );
  });

  it("summarizes the counts and both upstream commits in the PR", () => {
    const { title, body } = renderSyncPullRequest(change);

    expect(title).toBe("Update built-in blocklist (+2, -1)");
    expect(body).toContain("**2** added, **1** removed");
    expect(body).toContain(
      `https://github.com/disposable-email-domains/disposable-email-domains/compare/${OLD_SHA}...${NEW_SHA}`,
    );
    expect(body).toContain("- `d.com`\n- `e.com`");
    expect(body).toContain("- `a.com`");
  });

  it("uses singular wording for a single domain", () => {
    const { changeset } = renderSyncPullRequest({
      ...change,
      added: ["d.com"],
      removed: [],
    });

    expect(changeset).toContain("1 domain added, 0 removed.");
  });

  it("caps long domain lists in the PR body", () => {
    const added = Array.from({ length: 120 }, (_, i) => `d${i}.com`);
    const { body } = renderSyncPullRequest({ ...change, added });

    expect(body).toContain("- `d0.com`");
    expect(body).not.toContain("`d119.com`");
    expect(body).toContain("…and 20 more");
  });
});
