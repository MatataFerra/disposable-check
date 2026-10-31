# disposable-check

Detect disposable email addresses (mailinator.com, 10minutemail.com and about 10,000 others) in Node, edge runtimes and browsers. Zero dependencies, synchronous, typed.

```ts
import { isDisposableEmail } from "disposable-check";

isDisposableEmail("someone@mailinator.com"); // true
isDisposableEmail("someone@inbox.mailinator.com"); // true, subdomains count
isDisposableEmail("someone@gmail.com"); // false
```

## What it does, and what it doesn't

A **disposable domain** belongs to a service that hands out temporary addresses without sign-up. This library answers one question: is this email's domain (or one of its parents) on a list of disposable domains?

It deliberately does **not**:

- flag free providers such as gmail.com or outlook.com,
- flag role accounts such as `admin@` or `noreply@`,
- catch typos such as `gmial.com`,
- validate email syntax against RFC 5322. Use your schema validator for that.

## Install

```sh
npm install disposable-check
```

The package is ESM-only. It needs Node 22.12 or later, which can `require()` it as well as `import` it. The core has no runtime-specific code (only standard JavaScript and `URL`), so it also works on edge runtimes such as Cloudflare Workers and Vercel Edge, on Deno and Bun, and in browsers. CI tests it on Node.

## Usage

### Yes or no

```ts
import { isDisposableDomain, isDisposableEmail } from "disposable-check";

isDisposableEmail("someone@10minutemail.com"); // true
isDisposableDomain("mailinator.com"); // true
```

Both return `false` for input they can't read as an email or a domain. Use `checkEmail` / `checkDomain` when you need to tell "not disposable" apart from "invalid".

### The detailed answer

```ts
import { checkDomain, checkEmail } from "disposable-check";

checkEmail("Someone@Inbox.Mailinator.com");
// {
//   verdict: "disposable",
//   domain: "inbox.mailinator.com",
//   matchedRule: { domain: "mailinator.com", source: "built-in" }
// }

checkEmail("someone@gmail.com");
// { verdict: "not-listed", domain: "gmail.com", matchedRule: null }

checkEmail("not-an-email");
// { verdict: "invalid", domain: null, matchedRule: null }
```

`CheckResult` has this shape:

```ts
interface CheckResult {
  verdict: "disposable" | "allowed" | "not-listed" | "invalid";
  domain: string | null; // the canonical domain evaluated, null when invalid
  matchedRule: { domain: string; source: RuleSource } | null;
}

type RuleSource = "built-in" | "custom-block" | "custom-allow";
```

These types are exported, along with `Verdict`, `MatchedRule`, `Checker` and `CheckerOptions`. `disposable-check/dns` exports `MxStatus`, `MxRecord`, `MxResolver` and `CheckMxOptions`.

| `verdict`    | Meaning                                                                      |
| ------------ | ---------------------------------------------------------------------------- |
| `disposable` | The matched rule comes from the built-in blocklist or your custom blocklist. |
| `allowed`    | The matched rule comes from your custom allowlist.                           |
| `not-listed` | No rule matches.                                                             |
| `invalid`    | The input can't be read as an email or a domain.                             |

`matchedRule.source` tells you whether a rejection came from the built-in blocklist or from your own rules. That's the first thing you'll want to know when someone reports a false positive.

### Your own rules

```ts
import { createChecker } from "disposable-check";

const checker = createChecker({
  allow: ["corp.mailinator.com"], // never disposable
  block: ["evil.example.com"], // disposable, on top of the built-in blocklist
});

checker.checkEmail("me@corp.mailinator.com").verdict; // "allowed"
checker.checkEmail("me@other.mailinator.com").verdict; // "disposable" (built-in)
checker.checkDomain("mx.evil.example.com").verdict; // "disposable" (custom-block)
```

A checker has the same four functions as the package: `isDisposableEmail`, `isDisposableDomain`, `checkEmail` and `checkDomain`. It's immutable, holds no global state and is cheap to create, so it's safe to share across requests. The top-level functions are those of a checker with no custom rules.

**How rules match.** A rule is a domain, and it matches that domain and every subdomain of it. When several rules match, **the most specific one (the longest domain) decides**, whatever list it comes from. If an allow rule and a block rule name exactly the same domain, **allow wins**. That's how both examples above work: `corp.mailinator.com` is more specific than the built-in `mailinator.com`, and `evil.example.com` would be more specific than an allowed `example.com`.

**Invalid rules throw.** Rules are read like any input, so `" München.DE. "` works. A rule that isn't a domain throws a `TypeError` naming it when you create the checker. That's a bug in your code, not bad user input. Wildcards aren't needed, because a rule already covers its subdomains:

```ts
createChecker({ block: ["*.example.com"] });
// TypeError: Invalid block rule "*.example.com": expected a domain such as "example.com". Drop the wildcard: "example.com" already covers its subdomains.
```

A rule needs at least two labels, so `"com"` is rejected.

### How input is read

- Surrounding whitespace is trimmed and letters are lowercased.
- An email's domain is everything after the **last** `@`. The local part is ignored, and an empty local part makes the email invalid.
- One trailing dot is dropped (`mailinator.com.`).
- Internationalized domains are converted to punycode (`münchen.de` becomes `xn--mnchen-3ya.de`). The conversion uses the runtime's built-in `URL`, so very old browsers may differ on unusual inputs.
- IP addresses, single-label names (`localhost`), URLs, ports, paths, wildcards and labels outside letters, digits and inner hyphens are `invalid`.

Nothing in the core throws for a string input.

## MX check (Node only)

A separate entry point looks up whether a domain accepts mail. It's async and uses `node:dns`, so it isn't part of the core and never reaches your browser bundle.

```ts
import { checkMx } from "disposable-check/dns";

await checkMx("someone@gmail.com"); // "has-mx"
await checkMx("example.com"); // "no-mx" (it publishes a Null MX)
await checkMx("x.com", { timeoutMs: 2000 }); // "unknown" if DNS doesn't answer in time
```

| MX status | Meaning                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| `has-mx`  | At least one real MX record.                                                                                              |
| `no-mx`   | The domain doesn't exist, has no MX records, or publishes a Null MX ([RFC 7505](https://www.rfc-editor.org/rfc/rfc7505)). |
| `unknown` | The lookup failed or timed out, or the input isn't an email or a domain.                                                  |

`checkMx` never rejects. It doesn't fall back to A records. It's independent of the disposable verdict: many disposable domains do receive mail, which is how they work. Combine the two answers however your app needs.

Options:

- `timeoutMs` (default `5000`): gives up with `unknown`. A query on the system resolver is also cancelled, so it doesn't keep the process alive.
- `resolveMx(domain)`: your own lookup, returning `Promise<{ exchange, priority }[]>`. Use it for custom DNS servers, caching, or tests.

## Bundle size and runtimes

The core is about 58 KB minified and gzipped, nearly all of it the built-in blocklist, which is parsed on first use. It uses only standard JavaScript and `URL`. CI checks that the core never imports a Node built-in and that it stays under 70 KB.

## Where the list comes from

The built-in blocklist is a snapshot of the community-maintained [disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains) list, dedicated to the public domain under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Thanks to its maintainers. Each release embeds the list at a fixed upstream commit, recorded at the top of the generated file. Nothing is downloaded at runtime.

The upstream maintainers don't guarantee that every listed domain is still disposable. If one causes a false positive for you, add it to your custom allowlist (`allow`). Report wrongly listed domains upstream, not here.

**Versioning.** The API follows semver. Updates to the built-in blocklist ship as **patch** releases, because they change data rather than the API. Pin an exact version if you need the list frozen.

## License

[MIT](./LICENSE). The built-in blocklist is [CC0 1.0](https://github.com/disposable-email-domains/disposable-email-domains/blob/main/LICENSE.txt).
