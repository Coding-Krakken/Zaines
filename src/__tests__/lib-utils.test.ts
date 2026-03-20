import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";
import { createIdempotencyKey } from "@/lib/idempotency";

describe("cn()", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes (falsy values omitted)", () => {
    expect(cn("foo", false && "bar", null, undefined, "baz")).toBe("foo baz");
  });

  it("resolves tailwind conflicts (last wins)", () => {
    const result = cn("p-2", "p-4");
    expect(result).toBe("p-4");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles object syntax", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });
});

describe("createIdempotencyKey()", () => {
  it("includes the prefix", () => {
    const key = createIdempotencyKey("booking");
    expect(key.startsWith("booking-")).toBe(true);
  });

  it("returns unique keys on successive calls", () => {
    const key1 = createIdempotencyKey("pay");
    const key2 = createIdempotencyKey("pay");
    expect(key1).not.toBe(key2);
  });

  it("produces a non-empty string after the prefix", () => {
    const key = createIdempotencyKey("test");
    const parts = key.split("-");
    expect(parts.length).toBeGreaterThanOrEqual(2);
    const suffix = parts.slice(1).join("-");
    expect(suffix.length).toBeGreaterThan(0);
  });

  it("uses fallback when crypto.randomUUID is unavailable", () => {
    const origCrypto = globalThis.crypto;
    // Override crypto to remove randomUUID
    Object.defineProperty(globalThis, "crypto", {
      value: {},
      configurable: true,
      writable: true,
    });

    try {
      const key = createIdempotencyKey("fallback");
      expect(key.startsWith("fallback-")).toBe(true);
      // fallback format: prefix-<timestamp>-<random>
      const parts = key.split("-");
      expect(parts.length).toBeGreaterThanOrEqual(3);
    } finally {
      Object.defineProperty(globalThis, "crypto", {
        value: origCrypto,
        configurable: true,
        writable: true,
      });
    }
  });
});
