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
});
