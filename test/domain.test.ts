import { describe, expect, it } from "vitest";
import { checkDomain, isDisposableDomain } from "../src/index.ts";

describe("isDisposableDomain", () => {
  it("is true for a domain on the built-in blocklist", () => {
    expect(isDisposableDomain("mailinator.com")).toBe(true);
  });

  it("is false for a domain on no list", () => {
    expect(isDisposableDomain("gmail.com")).toBe(false);
  });
});

describe("checkDomain", () => {
  it("reports a built-in blocklist domain as disposable, naming the matched rule", () => {
    expect(checkDomain("mailinator.com")).toEqual({
      verdict: "disposable",
      domain: "mailinator.com",
      matchedRule: { domain: "mailinator.com", source: "built-in" },
    });
  });

  it("matches a direct subdomain of a rule", () => {
    expect(checkDomain("foo.mailinator.com")).toEqual({
      verdict: "disposable",
      domain: "foo.mailinator.com",
      matchedRule: { domain: "mailinator.com", source: "built-in" },
    });
  });

  it("matches deeper subdomains of a rule, naming the rule that matched", () => {
    expect(checkDomain("foo.bar.mailinator.com")).toEqual({
      verdict: "disposable",
      domain: "foo.bar.mailinator.com",
      matchedRule: { domain: "mailinator.com", source: "built-in" },
    });
  });

  it("does not treat the parent of a third-level rule as disposable", () => {
    expect(checkDomain("0-mailer.dynv6.net").verdict).toBe("disposable");
    expect(checkDomain("x.0-mailer.dynv6.net").verdict).toBe("disposable");
    expect(checkDomain("dynv6.net").verdict).toBe("not-listed");
  });

  it.each([
    ["  MAILINATOR.com ", "mailinator.com"],
    ["mailinator.com.", "mailinator.com"],
    ["Foo.Mailinator.COM.", "foo.mailinator.com"],
    ["灵.cc", "xn--5nx.cc"],
  ])("evaluates %j as the canonical domain %j", (input, canonical) => {
    expect(checkDomain(input)).toMatchObject({
      verdict: "disposable",
      domain: canonical,
    });
  });

  it.each([
    ["empty", ""],
    ["only whitespace", "   "],
    ["no dot", "localhost"],
    ["IPv4 literal", "127.0.0.1"],
    ["obfuscated IPv4", "0x7f.1"],
    ["IPv6 literal", "[::1]"],
    ["bracketed IPv4", "[127.0.0.1]"],
    ["empty label", "mailinator..com"],
    ["asterisk label", "*.mailinator.com"],
    ["symbol in label", "mail$inator.com"],
    ["quote in label", "mail'inator.com"],
    ["leading hyphen", "-mailinator.com"],
    ["trailing hyphen", "mailinator.com-"],
    ["label over 63 characters", `${"a".repeat(64)}.com`],
    ["domain over 253 characters", `${"abcde.".repeat(42)}com`],
    ["inner whitespace", "mail inator.com"],
    ["email instead of domain", "x@mailinator.com"],
    ["URL instead of domain", "https://mailinator.com"],
    ["path", "mailinator.com/inbox"],
    ["port", "mailinator.com:25"],
    ["percent-encoding", "m%61ilinator.com"],
  ])("rejects %s (%j) as invalid", (_, input) => {
    expect(checkDomain(input)).toEqual({
      verdict: "invalid",
      domain: null,
      matchedRule: null,
    });
    expect(isDisposableDomain(input)).toBe(false);
  });

  it("reports the canonical domain even when no rule matches", () => {
    expect(checkDomain(" München.DE ")).toEqual({
      verdict: "not-listed",
      domain: "xn--mnchen-3ya.de",
      matchedRule: null,
    });
  });

  it("reports input far longer than any domain as invalid without parsing it", () => {
    expect(checkDomain(`${" ".repeat(1_000)}mailinator.com`).verdict).toBe(
      "invalid",
    );
  });
});
