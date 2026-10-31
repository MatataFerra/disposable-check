import { describe, expect, it } from "vitest";
import { checkMx, type MxRecord } from "../src/dns.ts";

const failingWith = (code: string) => async (): Promise<MxRecord[]> => {
  throw Object.assign(new Error(`queryMx ${code}`), { code });
};

const resolvingTo =
  (byDomain: Record<string, MxRecord[]>) => async (domain: string) =>
    byDomain[domain] ?? [];

describe("checkMx", () => {
  it("reports has-mx when the domain has a mail exchanger", async () => {
    const resolveMx = resolvingTo({
      "gmail.com": [{ exchange: "gmail-smtp-in.l.google.com", priority: 5 }],
    });

    expect(await checkMx("gmail.com", { resolveMx })).toBe("has-mx");
  });

  it("reports no-mx when the domain has no MX records", async () => {
    expect(await checkMx("example.com", { resolveMx: resolvingTo({}) })).toBe(
      "no-mx",
    );
  });

  it("reports no-mx for a Null MX, which declares the domain takes no mail", async () => {
    const resolveMx = resolvingTo({
      "example.com": [{ exchange: "", priority: 0 }],
    });

    expect(await checkMx("example.com", { resolveMx })).toBe("no-mx");
  });

  it.each([
    ["the domain doesn't exist", "ENOTFOUND"],
    ["the domain has no MX records", "ENODATA"],
  ])("reports no-mx when %s (%s)", async (_, code) => {
    expect(await checkMx("example.com", { resolveMx: failingWith(code) })).toBe(
      "no-mx",
    );
  });

  it.each(["ESERVFAIL", "ETIMEOUT", "ECONNREFUSED"])(
    "reports unknown when the lookup fails (%s)",
    async (code) => {
      expect(
        await checkMx("example.com", { resolveMx: failingWith(code) }),
      ).toBe("unknown");
    },
  );

  it("reports unknown when the resolver throws something that isn't an error", async () => {
    const resolveMx = async (): Promise<MxRecord[]> => {
      throw null;
    };

    expect(await checkMx("example.com", { resolveMx })).toBe("unknown");
  });

  it("reports unknown when the lookup takes longer than the timeout", async () => {
    const resolveMx = () => new Promise<MxRecord[]>(() => {});

    expect(await checkMx("example.com", { resolveMx, timeoutMs: 10 })).toBe(
      "unknown",
    );
  });

  it.each(["", "localhost", "a@", "x@[127.0.0.1]"])(
    "reports unknown without a lookup for the invalid input %j",
    async (input) => {
      const lookedUp: string[] = [];
      const resolveMx = async (domain: string) => {
        lookedUp.push(domain);
        return [];
      };

      expect(await checkMx(input, { resolveMx })).toBe("unknown");
      expect(lookedUp).toEqual([]);
    },
  );

  it("looks up the canonical domain of an email or a domain", async () => {
    const lookedUp: string[] = [];
    const resolveMx = async (domain: string) => {
      lookedUp.push(domain);
      return [{ exchange: "mx.example.com", priority: 10 }];
    };

    expect(await checkMx(" Someone@München.DE ", { resolveMx })).toBe("has-mx");
    expect(await checkMx("München.DE.", { resolveMx })).toBe("has-mx");
    expect(lookedUp).toEqual(["xn--mnchen-3ya.de", "xn--mnchen-3ya.de"]);
  });

  it.each([
    ["null", null],
    ["an object", {}],
    ["a null record", [null]],
    ["a record without exchange", [{ priority: 10 }]],
    ["a non-string exchange", [{ exchange: 5, priority: 10 }]],
  ])("reports unknown when the resolver returns %s", async (_, answer) => {
    const resolveMx = async () => answer as unknown as MxRecord[];

    expect(await checkMx("example.com", { resolveMx })).toBe("unknown");
  });

  it("ignores malformed records next to a real mail exchanger", async () => {
    const resolveMx = async () =>
      [null, { exchange: "mx.example.com", priority: 10 }] as MxRecord[];

    expect(await checkMx("example.com", { resolveMx })).toBe("has-mx");
  });

  it.each([42, null, undefined])(
    "reports unknown for the non-string input %j",
    async (input) => {
      expect(await checkMx(input as unknown as string)).toBe("unknown");
    },
  );

  it.each([Number.NaN, -1, 0, Number.POSITIVE_INFINITY])(
    "falls back to the default timeout for timeoutMs %j",
    async (timeoutMs) => {
      const resolveMx = () =>
        new Promise<MxRecord[]>((resolve) =>
          setTimeout(
            () => resolve([{ exchange: "mx.a.com", priority: 1 }]),
            20,
          ),
        );

      expect(await checkMx("example.com", { resolveMx, timeoutMs })).toBe(
        "has-mx",
      );
    },
  );
});
