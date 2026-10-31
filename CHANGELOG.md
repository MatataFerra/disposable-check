# disposable-check

## 0.1.2

### Patch Changes

- 9ff6210: `checkEmail`, `checkDomain`, `isDisposableEmail` and `isDisposableDomain` no longer throw when JavaScript callers pass a value that isn't a string (for example `null` or an array from a request body). They report it as `invalid`, like `checkMx` already did.

## 0.1.1

### Patch Changes

- 6d1d811: Document where to run checks: on the server, with a server action example.

## 0.1.0

### Minor Changes

- 615c7bc: Initial release: detect disposable email addresses and domains against the built-in blocklist, with custom allowlist and blocklist rules, plus an MX check in `disposable-check/dns`.
