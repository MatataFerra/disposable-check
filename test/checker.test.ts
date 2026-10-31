import { describe, expect, it } from "vitest";
import { createChecker, isDisposableDomain } from "../src/index.ts";

describe("createChecker", () => {
  it("lets a custom allowlist rule override the built-in blocklist", () => {
    expect(
      createChecker({ allow: ["mailinator.com"] }).checkDomain(
        "mailinator.com",
      ),
    ).toEqual({
      verdict: "allowed",
      domain: "mailinator.com",
      matchedRule: { domain: "mailinator.com", source: "custom-allow" },
    });
  });

  it("allows a subdomain of a built-in rule without allowing its siblings", () => {
    const checker = createChecker({ allow: ["corp.mailinator.com"] });

    expect(checker.checkDomain("corp.mailinator.com").verdict).toBe("allowed");
    expect(checker.checkEmail("me@team.corp.mailinator.com").verdict).toBe(
      "allowed",
    );
    expect(checker.checkDomain("foo.mailinator.com").matchedRule).toEqual({
      domain: "mailinator.com",
      source: "built-in",
    });
  });

  it("blocks a subdomain inside an allowed domain", () => {
    const checker = createChecker({
      allow: ["example.com"],
      block: ["evil.example.com"],
    });

    expect(checker.checkDomain("evil.example.com")).toEqual({
      verdict: "disposable",
      domain: "evil.example.com",
      matchedRule: { domain: "evil.example.com", source: "custom-block" },
    });
    expect(checker.isDisposableEmail("x@mx.evil.example.com")).toBe(true);
    expect(checker.checkDomain("www.example.com").verdict).toBe("allowed");
  });

  it("lets allow win when both custom lists have the same rule", () => {
    const checker = createChecker({
      allow: ["example.com"],
      block: ["example.com"],
    });

    expect(checker.checkDomain("example.com").verdict).toBe("allowed");
  });

  it("adds custom blocklist rules on top of the built-in blocklist", () => {
    const checker = createChecker({ block: ["example.com"] });

    expect(checker.isDisposableDomain("example.com")).toBe(true);
    expect(checker.isDisposableDomain("mailinator.com")).toBe(true);
  });

  it("reads custom rules as canonical domains", () => {
    const checker = createChecker({ block: [" München.DE. "] });

    expect(checker.checkEmail("x@münchen.de").matchedRule).toEqual({
      domain: "xn--mnchen-3ya.de",
      source: "custom-block",
    });
  });

  describe.each(["allow", "block"] as const)("an invalid %s rule", (list) => {
    it.each(["@foo.com", "https://foo.com", "", "127.0.0.1", "localhost"])(
      "throws a TypeError naming %j",
      (rule) => {
        const create = () => createChecker({ [list]: [rule] });
        expect(create).toThrow(TypeError);
        expect(create).toThrow(`Invalid ${list} rule ${JSON.stringify(rule)}`);
      },
    );

    it.each([
      [123, "123"],
      [null, "null"],
    ])("throws a TypeError naming the non-string rule %j", (rule, shown) => {
      const create = () =>
        createChecker({ [list]: [rule] as unknown as string[] });
      expect(create).toThrow(TypeError);
      expect(create).toThrow(`Invalid ${list} rule ${shown}`);
    });

    it("throws a TypeError when the list is not an array", () => {
      const create = () =>
        createChecker({ [list]: "foo.com" as unknown as string[] });
      expect(create).toThrow(TypeError);
      expect(create).toThrow(`"${list}" must be an array of domains`);
    });
  });

  it("explains that rules already cover subdomains when given a wildcard", () => {
    expect(() => createChecker({ block: ["*.foo.com"] })).toThrow(
      /Invalid block rule "\*\.foo\.com".*"foo\.com" already covers its subdomains/,
    );
  });

  it.each(["*.", "*.*.foo.com"])(
    "doesn't suggest an invalid replacement for %j",
    (rule) => {
      expect(() => createChecker({ block: [rule] })).toThrow(
        /^(?!.*already covers)/,
      );
    },
  );

  it("keeps checkers independent of each other and of the default functions", () => {
    const rules = ["example.com"];
    const blocking = createChecker({ block: rules });
    const plain = createChecker();
    rules.push("gmail.com");

    expect(blocking.isDisposableDomain("example.com")).toBe(true);
    expect(blocking.isDisposableDomain("gmail.com")).toBe(false);
    expect(plain.isDisposableDomain("example.com")).toBe(false);
    expect(isDisposableDomain("example.com")).toBe(false);
  });
});
