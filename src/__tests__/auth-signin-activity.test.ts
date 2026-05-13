import { describe, expect, it, vi } from "vitest";
import { persistSignInActivity } from "@/lib/auth/signin-activity";

describe("sign in activity persistence", () => {
  it("persists non-suspicious sign in and logs success event", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      ipAddress: "203.0.113.10",
      userAgent: "Mozilla/5.0 Safari",
    });
    const create = vi.fn().mockResolvedValue({ id: "activity-1" });
    const logEvent = vi.fn();

    const result = await persistSignInActivity({
      userId: "user-1",
      provider: "google",
      ipAddress: "203.0.113.10",
      userAgent: "Mozilla/5.0 Safari",
      activityStore: { findFirst, create },
      logEvent,
    });

    expect(result.isSuspicious).toBe(false);
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        eventType: "sign_in",
        provider: "google",
        ipAddress: "203.0.113.10",
        userAgent: "Mozilla/5.0 Safari",
        isSuspicious: false,
      },
    });
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "AUTH_LOGIN_SUCCESS",
        level: "info",
      }),
    );
  });

  it("persists suspicious sign in and logs suspicious event", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      ipAddress: "203.0.113.10",
      userAgent: "Mozilla/5.0 Safari",
    });
    const create = vi.fn().mockResolvedValue({ id: "activity-2" });
    const logEvent = vi.fn();

    const result = await persistSignInActivity({
      userId: "user-2",
      provider: "facebook",
      ipAddress: "198.51.100.24",
      userAgent: "Mozilla/5.0 Firefox",
      activityStore: { findFirst, create },
      logEvent,
    });

    expect(result.isSuspicious).toBe(true);
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: "user-2",
        eventType: "sign_in",
        provider: "facebook",
        ipAddress: "198.51.100.24",
        userAgent: "Mozilla/5.0 Firefox",
        isSuspicious: true,
      },
    });
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "AUTH_SUSPICIOUS_LOGIN",
        level: "warn",
      }),
    );
  });
});
