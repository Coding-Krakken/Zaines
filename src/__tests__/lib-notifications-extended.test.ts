import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import fs from "fs";
import path from "path";

// We test the exported functions directly; mocking fetch and fs where needed.

const QUEUE_PATH = path.resolve(process.cwd(), "tmp", "email-queue.log");

async function rmQueue() {
  try {
    await fs.promises.unlink(QUEUE_PATH);
  } catch {
    // ignore
  }
}

describe("sendPaymentNotification() – extended coverage", () => {
  let fetchSpy: MockInstance;

  beforeEach(async () => {
    delete process.env.RESEND_API_KEY;
    await rmQueue();
    // reset module cache so DEV_QUEUE_PATH resolves fresh
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(async () => {
    await rmQueue();
    fetchSpy.mockRestore();
    delete process.env.RESEND_API_KEY;
    vi.restoreAllMocks();
  });

  it("returns no-recipient when booking has no email", async () => {
    const { sendPaymentNotification } = await import("@/lib/notifications");
    const result = await sendPaymentNotification("booking-001", "success", {
      user: { email: null },
    });
    expect(result.sent).toBe(false);
    expect(result.detail).toBe("no-recipient");
  });

  it("writes to dev queue when RESEND_API_KEY is not set (success type)", async () => {
    const { sendPaymentNotification } = await import("@/lib/notifications");
    const result = await sendPaymentNotification("booking-002", "success", {
      bookingNumber: "PB-NOTIFY-0001",
      user: { email: "owner@example.com" },
    });
    expect(result.provider).toBe("dev-queue");
    expect(result.sent).toBe(false);

    const contents = await fs.promises.readFile(QUEUE_PATH, "utf8");
    expect(contents).toContain("payment_notification");
    expect(contents).toContain("booking-002");
  });

  it("writes to dev queue when RESEND_API_KEY is not set (failure type)", async () => {
    const { sendPaymentNotification } = await import("@/lib/notifications");
    const result = await sendPaymentNotification("booking-003", "failure", {
      bookingNumber: "PB-NOTIFY-0002",
      user: { email: "owner@example.com" },
    });
    expect(result.provider).toBe("dev-queue");
    expect(result.sent).toBe(false);

    const contents = await fs.promises.readFile(QUEUE_PATH, "utf8");
    expect(contents).toContain("failure");
  });

  it("sends via Resend when API key is set and response is ok", async () => {
    process.env.RESEND_API_KEY = "re_test_abc";
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "email-001" }),
    } as unknown as Response);

    const { sendPaymentNotification } = await import("@/lib/notifications");
    const result = await sendPaymentNotification("booking-004", "success", {
      bookingNumber: "PB-NOTIFY-0003",
      user: { email: "customer@example.com" },
    });

    expect(result.sent).toBe(true);
    expect(result.provider).toBe("resend");
  });

  it("falls back to dev queue when Resend returns non-ok (4xx)", async () => {
    process.env.RESEND_API_KEY = "re_test_abc";
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ message: "unprocessable" }),
    } as unknown as Response);

    const { sendPaymentNotification } = await import("@/lib/notifications");
    const result = await sendPaymentNotification("booking-005", "success", {
      bookingNumber: "PB-NOTIFY-0004",
      user: { email: "customer@example.com" },
    });

    expect(result.sent).toBe(false);
    expect(result.provider).toBe("dev-queue");
  });

  it("falls back to dev queue when Resend throws after retries", async () => {
    process.env.RESEND_API_KEY = "re_test_abc";
    // Simulate 5xx on every attempt → throws after MAX_RETRIES
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ message: "service unavailable" }),
    } as unknown as Response);

    const { sendPaymentNotification } = await import("@/lib/notifications");
    const result = await sendPaymentNotification("booking-006", "failure", {
      bookingNumber: "PB-NOTIFY-0005",
      user: { email: "customer@example.com" },
    });

    expect(result.sent).toBe(false);
    expect(result.provider).toBe("dev-queue");
    expect(typeof result.detail).toBe("string");
  }, 30_000);
});

describe("sendBookingConfirmation() – extended coverage", () => {
  let fetchSpy: MockInstance;

  beforeEach(async () => {
    delete process.env.RESEND_API_KEY;
    await rmQueue();
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(async () => {
    await rmQueue();
    fetchSpy.mockRestore();
    delete process.env.RESEND_API_KEY;
    vi.restoreAllMocks();
  });

  it("returns no-recipient when booking has no user email", async () => {
    const { sendBookingConfirmation } = await import("@/lib/notifications");
    const result = await sendBookingConfirmation({
      id: "b-001",
      bookingNumber: "PB-CONFIRM-0001",
      user: { email: null },
    });
    expect(result.sent).toBe(false);
    expect(result.detail).toBe("no-recipient");
  });

  it("sends via Resend when API key is set and response is ok", async () => {
    process.env.RESEND_API_KEY = "re_test_abc";
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "email-002" }),
    } as unknown as Response);

    const { sendBookingConfirmation } = await import("@/lib/notifications");
    const result = await sendBookingConfirmation({
      id: "b-002",
      bookingNumber: "PB-CONFIRM-0002",
      user: { email: "customer@example.com", name: "Alice" },
    });

    expect(result.sent).toBe(true);
    expect(result.provider).toBe("resend");
  });

  it("falls back to dev queue when Resend returns non-ok (4xx)", async () => {
    process.env.RESEND_API_KEY = "re_test_abc";
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "bad request" }),
    } as unknown as Response);

    const { sendBookingConfirmation } = await import("@/lib/notifications");
    const result = await sendBookingConfirmation({
      id: "b-003",
      bookingNumber: "PB-CONFIRM-0003",
      user: { email: "customer@example.com" },
    });

    expect(result.sent).toBe(false);
    expect(result.provider).toBe("dev-queue");
  });

  it("falls back to dev queue when Resend throws after retries", async () => {
    process.env.RESEND_API_KEY = "re_test_abc";
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "internal server error" }),
    } as unknown as Response);

    const { sendBookingConfirmation } = await import("@/lib/notifications");
    const result = await sendBookingConfirmation({
      id: "b-004",
      bookingNumber: "PB-CONFIRM-0004",
      user: { email: "customer@example.com" },
    });

    expect(result.sent).toBe(false);
    expect(result.provider).toBe("dev-queue");
  }, 30_000);
});
