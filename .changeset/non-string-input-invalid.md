---
"disposable-check": patch
---

`checkEmail`, `checkDomain`, `isDisposableEmail` and `isDisposableDomain` no longer throw when JavaScript callers pass a value that isn't a string (for example `null` or an array from a request body). They report it as `invalid`, like `checkMx` already did.
