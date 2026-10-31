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
