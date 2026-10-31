import { builtInRules } from "./built-in-blocklist.ts";
import { toCanonicalDomain } from "./canonical-domain.ts";
import { findMatchedRule, type MatchedRule, type RuleList } from "./rules.ts";

export type Verdict = "disposable" | "allowed" | "not-listed" | "invalid";

export interface CheckResult {
  verdict: Verdict;
  /** Canonical domain that was evaluated, or `null` when the verdict is `invalid`. */
  domain: string | null;
  /** The most specific rule that matched, or `null` when none did. */
  matchedRule: MatchedRule | null;
}

export interface CheckerOptions {
  /** Domains that are never disposable, along with their subdomains. */
  allow?: readonly string[];
  /** Domains that are disposable on top of the built-in blocklist, along with their subdomains. */
  block?: readonly string[];
}

export interface Checker {
  checkDomain(input: string): CheckResult;
  isDisposableDomain(input: string): boolean;
  checkEmail(input: string): CheckResult;
  isDisposableEmail(input: string): boolean;
}

function invalidResult(): CheckResult {
  return { verdict: "invalid", domain: null, matchedRule: null };
}

function toRuleSet(
  domains: readonly string[],
  list: "allow" | "block",
): ReadonlySet<string> {
  // Validated at runtime too: JavaScript callers get no type checking.
  if (!Array.isArray(domains)) {
    throw new TypeError(`"${list}" must be an array of domains.`);
  }
  const rules = new Set<string>();
  for (const domain of domains) {
    const rule = typeof domain === "string" ? toCanonicalDomain(domain) : null;
    if (rule === null) throw new TypeError(invalidRuleMessage(domain, list));
    rules.add(rule);
  }
  return rules;
}

function invalidRuleMessage(domain: unknown, list: "allow" | "block"): string {
  const message = `Invalid ${list} rule ${JSON.stringify(domain) ?? String(domain)}: expected a domain such as "example.com".`;
  const unwildcarded =
    typeof domain === "string" && domain.trim().startsWith("*.")
      ? toCanonicalDomain(domain.trim().slice(2))
      : null;
  return unwildcarded === null
    ? message
    : `${message} Drop the wildcard: ${JSON.stringify(unwildcarded)} already covers its subdomains.`;
}

/** A checker that evaluates against the built-in blocklist plus the given custom lists. */
export function createChecker(options: CheckerOptions = {}): Checker {
  const allow = toRuleSet(options.allow ?? [], "allow");
  const block = toRuleSet(options.block ?? [], "block");
  // Order breaks ties between lists on the same rule: allow wins (ADR-0001).
  let lists: readonly RuleList[] | undefined;

  function checkDomain(input: string): CheckResult {
    const domain = toCanonicalDomain(input);
    if (domain === null) return invalidResult();
    // Built lazily so creating a checker doesn't parse the built-in blocklist.
    lists ??= [
      { source: "custom-allow", rules: allow },
      { source: "custom-block", rules: block },
      { source: "built-in", rules: builtInRules() },
    ];
    const matchedRule = findMatchedRule(domain, lists) ?? null;
    if (matchedRule === null) {
      return { verdict: "not-listed", domain, matchedRule };
    }
    const verdict =
      matchedRule.source === "custom-allow" ? "allowed" : "disposable";
    return { verdict, domain, matchedRule };
  }

  function checkEmail(input: string): CheckResult {
    const email = input.trim();
    const at = email.lastIndexOf("@");
    if (at < 1) return invalidResult();
    return checkDomain(email.slice(at + 1));
  }

  return Object.freeze({
    checkDomain,
    isDisposableDomain: (input: string) =>
      checkDomain(input).verdict === "disposable",
    checkEmail,
    isDisposableEmail: (input: string) =>
      checkEmail(input).verdict === "disposable",
  });
}
