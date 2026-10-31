import { describe, expect, it } from "vitest";
import {
  checkDomain,
  checkEmail,
  isDisposableDomain,
  isDisposableEmail,
} from "../src/index.ts";

const HOSTILE_INPUTS = [
  "",
  ".",
  "..",
  "@",
  "@@",
  "a@.",
  "\u0000",
  "\uD800.com",
  "x@\uD800.com",
  "xn--.com",
  "xn--a.com",
  "ﬀ.com",
  "a".repeat(10_000),
  `x@${"a.".repeat(5_000)}com`,
  "​@mailinator.com",
];

describe.each([checkDomain, checkEmail, isDisposableDomain, isDisposableEmail])(
  "%o",
  (fn) => {
    it.each(HOSTILE_INPUTS)("does not throw for %j", (input) => {
      expect(() => fn(input)).not.toThrow();
    });
  },
);

// A JavaScript caller can pass whatever a request body held.
const NON_STRING_INPUTS = [undefined, null, 42, {}, ["a@b.com"]] as unknown[];

describe.each([checkDomain, checkEmail])("%o with a non-string", (fn) => {
  it.each(NON_STRING_INPUTS)("reports %j as invalid", (input) => {
    expect(fn(input as string)).toEqual({
      verdict: "invalid",
      domain: null,
      matchedRule: null,
    });
  });
});

describe.each([isDisposableDomain, isDisposableEmail])(
  "%o with a non-string",
  (fn) => {
    it.each(NON_STRING_INPUTS)("returns false for %j", (input) => {
      expect(fn(input as string)).toBe(false);
    });
  },
);
