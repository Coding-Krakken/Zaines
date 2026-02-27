/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  sendBookingConfirmation,
  sendPaymentNotification,
} from "@/lib/notifications";

type TestBooking = {
  id?: string;
  bookingNumber?: string;
  status?: string;
  user?: { email: string; name?: string };
};

describe("notifications helper (resend path)", () => {
  let fetchMock: any;

  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-key";
    fetchMock = vi.fn();
    // Assign global fetch for tests
    global.fetch = fetchMock;
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    vi.restoreAllMocks();
  });

  it("sends via Resend when API key present", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "r1" }) });

    const booking: TestBooking = {
      id: "b1",
      bookingNumber: "PB-1",
      status: "pending",
      user: { email: "a@b.com", name: "A" },
    };
    const res = await sendBookingConfirmation(booking);
    expect(res.provider).toBe("resend");
    expect(fetchMock).toHaveBeenCalled();
  });

  it("retries transient failures and succeeds", async () => {
    // fail twice with network error then succeed
    fetchMock
      .mockRejectedValueOnce(new Error("network"))
      .mockRejectedValueOnce(new Error("network2"))
      .mockResolvedValue({ ok: true, json: async () => ({ id: "r2" }) });

    const booking: TestBooking = {
      id: "b2",
      bookingNumber: "PB-2",
      status: "pending",
      user: { email: "x@y.com", name: "X" },
    };
    const res = await sendBookingConfirmation(booking);
    expect(res.provider).toBe("resend");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("sends payment notification via Resend", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "p1" }) });
    const booking: TestBooking = {
      id: "b3",
      bookingNumber: "PB-3",
      user: { email: "pay@x.com" },
    };
    const res = await sendPaymentNotification("b3", "success", booking);
    expect(res.provider).toBe("resend");
    expect(fetchMock).toHaveBeenCalled();
  });
});
