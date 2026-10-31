import { Resolver } from "node:dns/promises";
import {
  toCanonicalDomain,
  toCanonicalEmailDomain,
} from "./canonical-domain.ts";

// Resolver error codes meaning the domain has no MX records, as opposed to the
// lookup failing: the domain doesn't exist (NXDOMAIN) or has no records of that type.
const NO_RECORDS_CODES = new Set(["ENOTFOUND", "ENODATA"]);

const DEFAULT_TIMEOUT_MS = 5000;
// Timers fire almost at once for any delay above this (Node clamps it to 1 ms).
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/** Whether a domain accepts mail, as far as its MX records say. */
export type MxStatus = "has-mx" | "no-mx" | "unknown";

// Declared here rather than taken from node:dns so the published types don't
// depend on @types/node.
export interface MxRecord {
  exchange: string;
  priority: number;
}

/**
 * Looks up the MX records of `domain`. `signal` is aborted when `checkMx` stops
 * waiting (timeout or done), so the lookup can be cancelled.
 */
export type MxResolver = (
  domain: string,
  options: { signal: AbortSignal },
) => Promise<MxRecord[]>;

export interface CheckMxOptions {
  /** Give up and report `unknown` after this many milliseconds. Defaults to 5000. */
  timeoutMs?: number;
  /** Looks up MX records. Defaults to the system resolver from `node:dns`. */
  resolveMx?: MxResolver;
}

/** Looks up the MX records of an email's domain, or of a domain. Never rejects. */
export async function checkMx(
  emailOrDomain: string,
  options: CheckMxOptions = {},
): Promise<MxStatus> {
  const domain = toCanonicalLookupDomain(emailOrDomain);
  if (domain === null) return "unknown";

  const timeoutMs = isPositiveFinite(options?.timeoutMs)
    ? Math.min(options.timeoutMs, MAX_TIMEOUT_MS)
    : DEFAULT_TIMEOUT_MS;
  // A resolver of our own, so a timed-out query can be cancelled instead of
  // keeping the process alive until it finishes.
  const systemResolver = options?.resolveMx ? undefined : new Resolver();
  const resolveMx: MxResolver =
    options?.resolveMx ??
    ((name) => (systemResolver as Resolver).resolveMx(name));

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"unknown">((resolve) => {
    timer = setTimeout(() => resolve("unknown"), timeoutMs);
  });
  try {
    return await Promise.race([
      lookUp(domain, resolveMx, controller.signal),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
    controller.abort();
    systemResolver?.cancel();
  }
}

function toCanonicalLookupDomain(emailOrDomain: unknown): string | null {
  if (typeof emailOrDomain !== "string") return null;
  return emailOrDomain.includes("@")
    ? toCanonicalEmailDomain(emailOrDomain)
    : toCanonicalDomain(emailOrDomain);
}

function isPositiveFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

async function lookUp(
  domain: string,
  resolveMx: MxResolver,
  signal: AbortSignal,
): Promise<MxStatus> {
  let records: unknown;
  try {
    records = await resolveMx(domain, { signal });
  } catch (error) {
    const code = (error as { code?: unknown } | null)?.code;
    return typeof code === "string" && NO_RECORDS_CODES.has(code)
      ? "no-mx"
      : "unknown";
  }
  if (!Array.isArray(records)) return "unknown";

  const exchanges = records
    .map((record) => (record as Partial<MxRecord> | null)?.exchange)
    .filter((exchange) => typeof exchange === "string");
  if (exchanges.length === 0 && records.length > 0) return "unknown";
  // A Null MX (RFC 7505) has an empty exchange and declares the domain takes no mail.
  return exchanges.some((exchange) => exchange !== "" && exchange !== ".")
    ? "has-mx"
    : "no-mx";
}
