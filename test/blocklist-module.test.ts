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

  it("leaves out upstream entries that aren't domains, so one can't block a whole TLD", () => {
    const upstream =
      "org\nco\nx`<!--\nbad entry.com\n1.2.3.4\nmailinator.com\n";

    expect(renderBlocklistModule(upstream, SHA)).toContain(
      'export const builtInBlocklist: string = "mailinator.com";',
    );
  });

  it("stores internationalized upstream domains as punycode, the form input is matched in", () => {
    expect(renderBlocklistModule("灵.cc\n", SHA)).toContain('"xn--5nx.cc"');
  });

  it("produces identical output regardless of upstream line order", () => {
    expect(renderBlocklistModule("b.com\na.com\n", SHA)).toBe(
      renderBlocklistModule("a.com\nb.com\n", SHA),
    );
  });
});
