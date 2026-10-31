/**
 * The most specific rule in `rules` that matches `domain`: a rule matches its
 * own domain and every subdomain of it, and longer rules are more specific.
 */
export function findMatchedRule(
  domain: string,
  rules: ReadonlySet<string>,
): string | undefined {
  let candidate = domain;
  while (!rules.has(candidate)) {
    const dot = candidate.indexOf(".");
    if (dot === -1) return undefined;
    candidate = candidate.slice(dot + 1);
  }
  return candidate;
}
