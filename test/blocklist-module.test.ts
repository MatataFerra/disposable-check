import { describe, expect, it } from "vitest";
import { renderBlocklistModule } from "../scripts/blocklist-module.ts";

const SHA = "0123456789abcdef0123456789abcdef01234567";

describe("renderBlocklistModule", () => {
  it("embeds the upstream domains as one newline-separated string", () => {
    const module = renderBlocklistModule(
      "mailinator.com\n10minutemail.com\n",
      SHA,
    );

    expect(module).toContain(
      'export const builtInBlocklist: string = "10minutemail.com\\nmailinator.com";',
    );
  });

  it("marks the file as generated and names the upstream commit", () => {
    const module = renderBlocklistModule("mailinator.com\n", SHA);

    expect(module.startsWith("// DO NOT EDIT.")).toBe(true);
    expect(module).toContain(`disposable-email-domains@${SHA}`);
  });

  it("ignores blank lines, comments, surrounding whitespace, case and duplicates", () => {
    const upstream =
      "# comment\n\n  Mailinator.com \r\nmailinator.com\nyopmail.com\n";

    expect(renderBlocklistModule(upstream, SHA)).toContain(
      '"mailinator.com\\nyopmail.com"',
    );
  });

  it("produces identical output regardless of upstream line order", () => {
    expect(renderBlocklistModule("b.com\na.com\n", SHA)).toBe(
      renderBlocklistModule("a.com\nb.com\n", SHA),
    );
  });
});
