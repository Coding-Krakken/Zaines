import { describe, expect, it } from "vitest";
import {
  extractRequestFingerprint,
  isSuspiciousLoginAttempt,
  normalizeClientIp,
} from "@/lib/auth/security-heuristics";

describe("auth security heuristics", () => {
  it("normalizes forwarded IP values", () => {
    expect(normalizeClientIp("203.0.113.10, 10.0.0.1")).toBe("203.0.113.10");
  });

  it("extracts request fingerprint using first forwarded hop", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.2",
      "user-agent": "Mozilla/5.0 TestAgent",
    });

    expect(extractRequestFingerprint(headers)).toEqual({
      ipAddress: "203.0.113.10",
      userAgent: "Mozilla/5.0 TestAgent",
    });
  });

  it("falls back to x-real-ip when forwarded header is absent", () => {
    const headers = new Headers({
      "x-real-ip": "198.51.100.24",
      "user-agent": "Mozilla/5.0 TestAgent",
    });

    expect(extractRequestFingerprint(headers)).toEqual({
      ipAddress: "198.51.100.24",
      userAgent: "Mozilla/5.0 TestAgent",
    });
  });

  it("flags suspicious login when both IP and user agent change", () => {
    const suspicious = isSuspiciousLoginAttempt({
      previous: {
        ipAddress: "203.0.113.10",
        userAgent: "Mozilla/5.0 Safari",
      },
      current: {
        ipAddress: "198.51.100.8",
        userAgent: "Mozilla/5.0 Firefox",
      },
    });

    expect(suspicious).toBe(true);
  });

  it("does not flag when only one signal changes", () => {
    expect(
      isSuspiciousLoginAttempt({
        previous: {
          ipAddress: "203.0.113.10",
          userAgent: "Mozilla/5.0 Safari",
        },
        current: {
          ipAddress: "203.0.113.10",
          userAgent: "Mozilla/5.0 Firefox",
        },
      }),
    ).toBe(false);
  });
});
