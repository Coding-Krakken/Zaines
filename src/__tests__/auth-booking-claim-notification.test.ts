import fs from "fs/promises";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const QUEUE_PATH = path.resolve(process.cwd(), "tmp", "auth-claim-email-queue.log");

describe("booking claim notification", () => {
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

  it("queues booking claim email when resend is unavailable", async () => {
    const notifications = await import("@/lib/notifications");

    const result = await notifications.sendBookingClaimNotification({
      email: "guest@example.com",
      bookingNumber: "PB-20260513-1234",
      claimUrl: "https://example.com/auth/claim-booking?token=test",
      firstName: "Alex",
    });

    expect(result.provider).toBe("dev-queue");

    const queueContent = await fs.readFile(QUEUE_PATH, "utf8");
    expect(queueContent).toContain("booking_claim_notification");
    expect(queueContent).toContain("PB-20260513-1234");
  });
});
