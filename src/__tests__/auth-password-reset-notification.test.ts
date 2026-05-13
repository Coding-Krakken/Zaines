import fs from "fs/promises";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const QUEUE_PATH = path.resolve(process.cwd(), "tmp", "auth-reset-email-queue.log");

describe("password reset notification", () => {
  beforeEach(async () => {
    process.env.DEV_QUEUE_PATH = QUEUE_PATH;
    delete process.env.RESEND_API_KEY;
    await fs.rm(QUEUE_PATH, { force: true }).catch(() => undefined);
    vi.resetModules();
  });

  afterEach(async () => {
    delete process.env.DEV_QUEUE_PATH;
    delete process.env.RESEND_API_KEY;
    await fs.rm(QUEUE_PATH, { force: true }).catch(() => undefined);
  });

  it("falls back to dev queue when resend key is unavailable", async () => {
    const notifications = await import("@/lib/notifications");

    const result = await notifications.sendPasswordResetNotification({
      email: "customer@example.com",
      resetUrl: "https://example.com/auth/reset-password?token=test",
      firstName: "Alex",
    });

    expect(result.provider).toBe("dev-queue");

    const queueContent = await fs.readFile(QUEUE_PATH, "utf8");
    expect(queueContent).toContain("password_reset_notification");
    expect(queueContent).toContain("customer@example.com");
  });
});
