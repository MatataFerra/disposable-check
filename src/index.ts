import { type Checker, createChecker } from "./checker.ts";

export type {
  Checker,
  CheckerOptions,
  CheckResult,
  Verdict,
} from "./checker.ts";
export { createChecker } from "./checker.ts";
export type { MatchedRule, RuleSource } from "./rules.ts";

const defaultChecker = createChecker();

export const checkDomain: Checker["checkDomain"] = defaultChecker.checkDomain;
export const isDisposableDomain: Checker["isDisposableDomain"] =
  defaultChecker.isDisposableDomain;
export const checkEmail: Checker["checkEmail"] = defaultChecker.checkEmail;
export const isDisposableEmail: Checker["isDisposableEmail"] =
  defaultChecker.isDisposableEmail;
