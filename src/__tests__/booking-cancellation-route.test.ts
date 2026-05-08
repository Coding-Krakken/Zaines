import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as cancelBookingPost } from "@/app/api/bookings/[id]/cancel/route";

const {
  authMock,
  bookingFindUniqueMock,
  bookingUpdateMock,
  paymentUpdateManyMock,
  paymentUpdateMock,
  settingsFindManyMock,
  isDatabaseConfiguredMock,
  isStripeConfiguredMock,
  stripeRefundCreateMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  bookingFindUniqueMock: vi.fn(),
  bookingUpdateMock: vi.fn(),
  paymentUpdateManyMock: vi.fn(),
  paymentUpdateMock: vi.fn(),
  settingsFindManyMock: vi.fn(),
  isDatabaseConfiguredMock: vi.fn(),
  isStripeConfiguredMock: vi.fn(),
  stripeRefundCreateMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: {
      findUnique: bookingFindUniqueMock,
      update: bookingUpdateMock,
    },
    payment: {
      updateMany: paymentUpdateManyMock,
      update: paymentUpdateMock,
    },
    settings: {
      findMany: settingsFindManyMock,
    },
  },
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    refunds: {
      create: stripeRefundCreateMock,
    },
  },
  isStripeConfigured: isStripeConfiguredMock,
  formatAmountForStripe: (amount: number) => Math.round(amount * 100),
}));

describe("booking cancellation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    authMock.mockResolvedValue({ user: { id: "user-1" } });
    isDatabaseConfiguredMock.mockReturnValue(true);
    isStripeConfiguredMock.mockReturnValue(false);
    settingsFindManyMock.mockResolvedValue([]);

    bookingUpdateMock.mockResolvedValue({ id: "booking-1", status: "cancelled" });
    paymentUpdateManyMock.mockResolvedValue({ count: 1 });
    paymentUpdateMock.mockResolvedValue({ id: "payment-1", status: "refunded" });
  });

  it("returns 401 when user is not authenticated", async () => {
    authMock.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/bookings/booking-1/cancel", {
      method: "POST",
    });

    const response = await cancelBookingPost(request, {
      params: { id: "booking-1" },
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when booking does not exist or user does not own booking", async () => {
    bookingFindUniqueMock.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/bookings/missing/cancel", {
      method: "POST",
    });

    const response = await cancelBookingPost(request, {
      params: { id: "missing" },
    });

    expect(response.status).toBe(404);
  });

  it("cancels a booking and returns full-refund eligibility for 48+ hour window", async () => {
    const checkInDate = new Date(Date.now() + 72 * 60 * 60 * 1000);

    bookingFindUniqueMock.mockResolvedValueOnce({
      id: "booking-1",
      userId: "user-1",
      status: "confirmed",
      checkInDate,
      total: 300,
      payments: [
        {
          id: "payment-1",
          amount: 300,
          status: "succeeded",
          stripePaymentId: "pi_123",
        },
      ],
    });

    const request = new NextRequest("http://localhost:3000/api/bookings/booking-1/cancel", {
      method: "POST",
    });

    const response = await cancelBookingPost(request, {
      params: { id: "booking-1" },
    });

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.status).toBe("cancelled");
    expect(payload.cancellation.policyWindow).toBe("full_refund");
    expect(payload.cancellation.refundEligibleAmount).toBe(300);
    expect(payload.cancellation.refundPendingAmount).toBe(300);
    expect(bookingUpdateMock).toHaveBeenCalledWith({
      where: { id: "booking-1" },
      data: { status: "cancelled" },
    });
    expect(paymentUpdateManyMock).toHaveBeenCalled();
    expect(stripeRefundCreateMock).not.toHaveBeenCalled();
  });

  it("returns no-refund policy window when cancellation is inside 24 hours", async () => {
    const checkInDate = new Date(Date.now() + 6 * 60 * 60 * 1000);

    bookingFindUniqueMock.mockResolvedValueOnce({
      id: "booking-2",
      userId: "user-1",
      status: "pending",
      checkInDate,
      total: 180,
      payments: [],
    });

    const request = new NextRequest("http://localhost:3000/api/bookings/booking-2/cancel", {
      method: "POST",
    });

    const response = await cancelBookingPost(request, {
      params: { id: "booking-2" },
    });

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.cancellation.policyWindow).toBe("no_refund");
    expect(payload.cancellation.refundEligibleAmount).toBe(0);
    expect(payload.cancellation.refundPendingAmount).toBe(0);
  });

  it("processes partial refund when inside 24-48 hour window and Stripe is configured", async () => {
    const checkInDate = new Date(Date.now() + 30 * 60 * 60 * 1000);
    isStripeConfiguredMock.mockReturnValueOnce(true);

    bookingFindUniqueMock.mockResolvedValueOnce({
      id: "booking-3",
      userId: "user-1",
      status: "confirmed",
      checkInDate,
      total: 200,
      payments: [
        {
          id: "payment-3",
          amount: 200,
          status: "succeeded",
          stripePaymentId: "pi_789",
        },
      ],
    });

    stripeRefundCreateMock.mockResolvedValueOnce({ id: "re_123" });

    const request = new NextRequest(
      "http://localhost:3000/api/bookings/booking-3/cancel",
      {
        method: "POST",
      },
    );

    const response = await cancelBookingPost(request, {
      params: { id: "booking-3" },
    });

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.cancellation.policyWindow).toBe("partial_refund");
    expect(payload.cancellation.refundEligibleAmount).toBe(100);
    expect(payload.cancellation.refundedAmount).toBe(100);
    expect(payload.cancellation.refundPendingAmount).toBe(0);

    expect(stripeRefundCreateMock).toHaveBeenCalledWith({
      payment_intent: "pi_789",
      amount: 10000,
    });
    expect(paymentUpdateMock).toHaveBeenCalledWith({
      where: { id: "payment-3" },
      data: {
        status: "refunded",
        refundedAt: expect.any(Date),
        refundAmount: 100,
      },
    });
  });

  it("returns 409 for booking states that cannot be cancelled", async () => {
    bookingFindUniqueMock.mockResolvedValueOnce({
      id: "booking-4",
      userId: "user-1",
      status: "checked_in",
      checkInDate: new Date(Date.now() + 72 * 60 * 60 * 1000),
      total: 320,
      payments: [],
    });

    const request = new NextRequest(
      "http://localhost:3000/api/bookings/booking-4/cancel",
      {
        method: "POST",
      },
    );

    const response = await cancelBookingPost(request, {
      params: { id: "booking-4" },
    });

    expect(response.status).toBe(409);
  });
});
