import { builtInRules } from "./built-in-blocklist.ts";

export type Verdict = "disposable" | "allowed" | "not-listed" | "invalid";

export type RuleSource = "built-in" | "custom-block" | "custom-allow";

export interface CheckResult {
  verdict: Verdict;
  /** Canonical domain that was evaluated, or `null` when the verdict is `invalid`. */
  domain: string | null;
  /** The most specific rule that matched, or `null` when none did. */
  matchedRule: { domain: string; source: RuleSource } | null;
}

export function checkDomain(domain: string): CheckResult {
  if (builtInRules().has(domain)) {
    return {
      verdict: "disposable",
      domain,
      matchedRule: { domain, source: "built-in" },
    };
  }
  return { verdict: "not-listed", domain, matchedRule: null };
}

export function isDisposableDomain(domain: string): boolean {
  return checkDomain(domain).verdict === "disposable";
}
