// Characters that can't appear in a domain but that URL parsing would accept
// as part of something else (userinfo, port, path, IPv6 literal, escapes).
const NON_DOMAIN_CHARACTER = /[\s/\\?#@:[\]%*]/;

// Letters, digits and inner hyphens, 1 to 63 characters (RFC 1035 / RFC 5321).
const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

const MAX_DOMAIN_LENGTH = 253;

/**
 * The canonical domain for `input` (ASCII, lowercase, IDN as punycode, no
 * trailing dot), or `null` when `input` can't be read as a domain.
 */
export function toCanonicalDomain(input: string): string | null {
  // JavaScript callers can pass anything; that's invalid input, not a bug.
  if (typeof input !== "string") return null;
  const domain = input.trim().replace(/\.$/, "");
  if (domain === "" || NON_DOMAIN_CHARACTER.test(domain)) return null;

  let hostname: string;
  try {
    hostname = new URL(`http://${domain}`).hostname;
  } catch {
    return null;
  }

  const labels = hostname.split(".");
  const looksLikeIpv4 = /^\d+$/.test(labels.at(-1) ?? "");
  if (
    labels.length < 2 ||
    looksLikeIpv4 ||
    hostname.length > MAX_DOMAIN_LENGTH ||
    !labels.every((label) => LABEL.test(label))
  ) {
    return null;
  }
  return hostname;
}

/**
 * The canonical domain after the last `@` of `email`, or `null` when `email`
 * has no local part or its domain can't be read as a domain.
 */
export function toCanonicalEmailDomain(email: string): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf("@");
  return at < 1 ? null : toCanonicalDomain(trimmed.slice(at + 1));
}
