---
"disposable-check": minor
---

`checkMx` now passes an `AbortSignal` to a custom `resolveMx(domain, { signal })` and aborts it once it stops waiting, so a timed-out lookup can be cancelled. A `timeoutMs` above 2147483647 is capped instead of making the check give up after 1 ms. Input longer than 1,000 characters is reported as `invalid` without being parsed.
