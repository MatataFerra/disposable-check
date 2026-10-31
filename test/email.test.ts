import { describe, expect, it } from "vitest";
import { checkEmail, isDisposableEmail } from "../src/index.ts";

describe("checkEmail", () => {
  it("evaluates the email's domain, ignoring the local part", () => {
    expect(checkEmail("  Foo@MAILINATOR.COM ")).toEqual({
      verdict: "disposable",
      domain: "mailinator.com",
      matchedRule: { domain: "mailinator.com", source: "built-in" },
    });
  });

  it.each([
    ["a@b@mailinator.com", "disposable", "mailinator.com"],
    ["x@mailinator.com.", "disposable", "mailinator.com"],
    ["x@inbox.mailinator.com", "disposable", "inbox.mailinator.com"],
    ["x@münchen.de", "not-listed", "xn--mnchen-3ya.de"],
    ["someone@gmail.com", "not-listed", "gmail.com"],
  ])("evaluates %j as %s on %j", (email, verdict, domain) => {
    expect(checkEmail(email)).toMatchObject({ verdict, domain });
  });

  it.each([
    ["no @", "foo"],
    ["bare domain", "mailinator.com"],
    ["empty local part", "@mailinator.com"],
    ["empty domain", "a@"],
    ["IP literal", "x@[127.0.0.1]"],
    ["domain without dot", "x@localhost"],
    ["empty", ""],
  ])("rejects %s (%j) as invalid", (_, email) => {
    expect(checkEmail(email)).toEqual({
      verdict: "invalid",
      domain: null,
      matchedRule: null,
    });
    expect(isDisposableEmail(email)).toBe(false);
  });
});

describe("checkEmail with long input", () => {
  it("still evaluates an address with the longest local part", () => {
    expect(checkEmail(`${"a".repeat(64)}@mailinator.com`).verdict).toBe(
      "disposable",
    );
  });

  it("reports input far longer than any address as invalid without parsing it", () => {
    expect(checkEmail(`${"a".repeat(1_000)}@mailinator.com`).verdict).toBe(
      "invalid",
    );
  });
});

describe("isDisposableEmail", () => {
  it("is true for an address on a disposable domain", () => {
    expect(isDisposableEmail("someone@10minutemail.com")).toBe(true);
  });

  it("is false for an address on a domain on no list", () => {
    expect(isDisposableEmail("someone@gmail.com")).toBe(false);
  });
});
