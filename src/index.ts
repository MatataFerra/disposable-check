import { builtInRules } from "./built-in-blocklist.ts";
import { toCanonicalDomain } from "./canonical-domain.ts";
import { findMatchedRule } from "./rules.ts";

export type Verdict = "disposable" | "allowed" | "not-listed" | "invalid";

export type RuleSource = "built-in" | "custom-block" | "custom-allow";

export interface CheckResult {
  verdict: Verdict;
  /** Canonical domain that was evaluated, or `null` when the verdict is `invalid`. */
  domain: string | null;
  /** The most specific rule that matched, or `null` when none did. */
  matchedRule: { domain: string; source: RuleSource } | null;
}

function invalidResult(): CheckResult {
  return { verdict: "invalid", domain: null, matchedRule: null };
}

export function checkDomain(input: string): CheckResult {
  const domain = toCanonicalDomain(input);
  if (domain === null) return invalidResult();
  const rule = findMatchedRule(domain, builtInRules());
  if (rule !== undefined) {
    return {
      verdict: "disposable",
      domain,
      matchedRule: { domain: rule, source: "built-in" },
    };
  }
  return { verdict: "not-listed", domain, matchedRule: null };
}

export function isDisposableDomain(input: string): boolean {
  return checkDomain(input).verdict === "disposable";
}

export function checkEmail(input: string): CheckResult {
  const email = input.trim();
  const at = email.lastIndexOf("@");
  if (at < 1) return invalidResult();
  return checkDomain(email.slice(at + 1));
}

export function isDisposableEmail(input: string): boolean {
  return checkEmail(input).verdict === "disposable";
}
