export type RuleSource = "built-in" | "custom-block" | "custom-allow";

export interface MatchedRule {
  domain: string;
  source: RuleSource;
}

export interface RuleList {
  source: RuleSource;
  rules: ReadonlySet<string>;
}

/**
 * The most specific rule in `lists` that matches `domain`: a rule matches its
 * own domain and every subdomain of it, and longer rules are more specific.
 * When lists tie on the same rule, the earlier list wins.
 */
export function findMatchedRule(
  domain: string,
  lists: readonly RuleList[],
): MatchedRule | undefined {
  let candidate = domain;
  while (true) {
    const list = lists.find(({ rules }) => rules.has(candidate));
    if (list !== undefined) return { domain: candidate, source: list.source };
    const dot = candidate.indexOf(".");
    if (dot === -1) return undefined;
    candidate = candidate.slice(dot + 1);
  }
}
