import { describe, expect, it } from "vitest";
import {
  canRevokeSession,
  hasSuspiciousActivity,
  normalizeSecurityPayload,
} from "@/lib/auth/security-panel-state";

describe("security panel state helpers", () => {
  it("detects suspicious activity entries", () => {
    expect(
      hasSuspiciousActivity([
        {
          id: "a1",
          eventType: "sign_in",
          provider: "google",
          ipAddress: null,
          userAgent: null,
          isSuspicious: false,
          createdAt: "2026-05-13T12:00:00.000Z",
        },
        {
          id: "a2",
          eventType: "sign_in",
          provider: "credentials",
          ipAddress: "198.51.100.10",
          userAgent: "Mozilla/5.0",
          isSuspicious: true,
          createdAt: "2026-05-13T12:10:00.000Z",
        },
      ]),
    ).toBe(true);
  });

  it("allows revocation only for non-current database sessions that are not busy", () => {
    expect(
      canRevokeSession({
        strategy: "database",
        session: {
          id: "s1",
          expiresAt: "2026-05-14T12:00:00.000Z",
          current: false,
          deviceHint: "Safari",
        },
        busySessionId: null,
      }),
    ).toBe(true);

    expect(
      canRevokeSession({
        strategy: "database",
        session: {
          id: "s1",
          expiresAt: "2026-05-14T12:00:00.000Z",
          current: true,
          deviceHint: "Safari",
        },
        busySessionId: null,
      }),
    ).toBe(false);

    expect(
      canRevokeSession({
        strategy: "jwt",
        session: {
          id: "s1",
          expiresAt: "2026-05-14T12:00:00.000Z",
          current: false,
          deviceHint: "Safari",
        },
        busySessionId: null,
      }),
    ).toBe(false);

    expect(
      canRevokeSession({
        strategy: "database",
        session: {
          id: "s1",
          expiresAt: "2026-05-14T12:00:00.000Z",
          current: false,
          deviceHint: "Safari",
        },
        busySessionId: "s1",
      }),
    ).toBe(false);
  });

  it("normalizes null payload to empty state", () => {
    expect(normalizeSecurityPayload(null)).toEqual({
      sessions: [],
      activity: [],
      strategy: null,
      hasSuspicious: false,
    });
  });
});
