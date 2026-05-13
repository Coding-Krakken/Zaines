import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type SessionLike = {
  user: { id: string; email?: string | null; name?: string | null; role?: string };
} | null;

const {
  authMock,
  getAdminSettingsMock,
  stripeMock,
  prismaMock,
  isDatabaseConfiguredMock,
  isStripeConfiguredMock,
} = vi.hoisted(() => ({
  authMock: vi.fn<() => Promise<SessionLike>>(async () => ({
    user: { id: "user-001", email: "owner@example.com", name: "Owner" },
  })),
  getAdminSettingsMock: vi.fn(async () => ({
    stripeCapabilityFlags: {
      billingSubscriptionsEnabled: true,
      customerPortalEnabled: true,
      savedPaymentMethodsEnabled: true,
      oneClickRebookingEnabled: true,
      autopayEnabled: true,
      taxEnabled: false,
      disputesEnabled: false,
      radarReviewEnabled: false,
      connectEnabled: false,
      treasuryEnabled: false,
      issuingEnabled: false,
      financialConnectionsEnabled: false,
      identityEnabled: false,
      terminalEnabled: false,
      premiumCheckoutReassuranceEnabled: false,
      premiumCheckoutCopyEnabled: false,
      premiumCheckoutTrustIndicatorsEnabled: false,
      premiumCheckoutLoadingExperienceEnabled: false,
    },
  })),
  stripeMock: {
    customers: {
      list: vi.fn(async () => ({ data: [{ id: "cus_existing_001" }] })),
      create: vi.fn(async () => ({ id: "cus_created_001" })),
      retrieve: vi.fn(async () => ({
        id: "cus_existing_001",
        deleted: false,
        invoice_settings: {
          default_payment_method: "pm_default_001" as string | null,
        },
      })),
    },
    paymentIntents: {
      create: vi.fn(async () => ({
        id: "pi_one_click_001",
        status: "succeeded",
      })),
    },
  },
  prismaMock: {
    booking: {
      findUnique: vi.fn(async () => ({
        id: "booking-001",
        userId: "user-001",
        bookingNumber: "PB-20260513-0001",
        total: 220,
        status: "pending",
        checkInDate: new Date("2026-06-01T15:00:00.000Z"),
        checkOutDate: new Date("2026-06-03T10:00:00.000Z"),
        user: { email: "owner@example.com" },
      })),
      update: vi.fn(async () => ({ id: "booking-001", status: "confirmed" })),
    },
    payment: {
      findFirst: vi.fn(async () => ({
        id: "payment-001",
        status: "pending",
        stripePaymentId: null as string | null,
      })),
      create: vi.fn(async () => ({ id: "payment-new-001" })),
      update: vi.fn(async () => ({ id: "payment-001" })),
    },
    settings: {
      findUnique: vi.fn(async () => null),
      upsert: vi.fn(async () => ({ key: "payments.autopay_consent.user-001" })),
    },
  },
  isDatabaseConfiguredMock: vi.fn(() => true),
  isStripeConfiguredMock: vi.fn(() => true),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/api/admin-settings", () => ({ getAdminSettings: getAdminSettingsMock }));
vi.mock("@/lib/stripe", () => ({
  stripe: stripeMock,
  isStripeConfigured: isStripeConfiguredMock,
  formatAmountForStripe: (amount: number) => Math.round(amount * 100),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

import { POST as oneClickBookingPost } from "@/app/api/payments/one-click-booking/route";
import { GET as autopayGet, PUT as autopayPut } from "@/app/api/payments/autopay/route";

describe("payments one-click booking and autopay routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes one-click booking payment when enabled", async () => {
    const request = new NextRequest("http://localhost/api/payments/one-click-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-correlation-id": "one-click-cid",
      },
      body: JSON.stringify({ bookingId: "booking-001" }),
    });

    const response = await oneClickBookingPost(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.succeeded).toBe(true);
    expect(payload.paymentIntentId).toBe("pi_one_click_001");
    expect(prismaMock.booking.update).toHaveBeenCalledWith({
      where: { id: "booking-001" },
      data: { status: "confirmed" },
    });
  });

  it("returns autopay defaults when no consent exists", async () => {
    const request = new NextRequest("http://localhost/api/payments/autopay", {
      method: "GET",
      headers: {
        "x-correlation-id": "autopay-get-cid",
      },
    });

    const response = await autopayGet(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.consent).toMatchObject({
      enabled: false,
      allowIncidentals: false,
    });
  });

  it("saves autopay consent", async () => {
    const request = new NextRequest("http://localhost/api/payments/autopay", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-correlation-id": "autopay-put-cid",
      },
      body: JSON.stringify({
        enabled: true,
        allowIncidentals: true,
      }),
    });

    const response = await autopayPut(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.consent).toMatchObject({
      enabled: true,
      allowIncidentals: true,
    });
    expect(prismaMock.settings.upsert).toHaveBeenCalledTimes(1);
  });

  it("blocks one-click booking when feature is disabled", async () => {
    getAdminSettingsMock.mockResolvedValueOnce({
      stripeCapabilityFlags: {
        billingSubscriptionsEnabled: true,
        customerPortalEnabled: true,
        savedPaymentMethodsEnabled: true,
        oneClickRebookingEnabled: false,
        autopayEnabled: true,
        taxEnabled: false,
        disputesEnabled: false,
        radarReviewEnabled: false,
        connectEnabled: false,
        treasuryEnabled: false,
        issuingEnabled: false,
        financialConnectionsEnabled: false,
        identityEnabled: false,
        terminalEnabled: false,
        premiumCheckoutReassuranceEnabled: false,
        premiumCheckoutCopyEnabled: false,
        premiumCheckoutTrustIndicatorsEnabled: false,
        premiumCheckoutLoadingExperienceEnabled: false,
      },
    });

    const request = new NextRequest("http://localhost/api/payments/one-click-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId: "booking-001" }),
    });

    const response = await oneClickBookingPost(request);
    expect(response.status).toBe(403);
  });

  it("returns actionable fallback when one-click needs authentication", async () => {
    stripeMock.paymentIntents.create.mockRejectedValueOnce({
      code: "authentication_required",
      payment_intent: {
        id: "pi_requires_action_001",
        status: "requires_action",
        client_secret: "pi_requires_action_001_secret_abc",
      },
    });

    const request = new NextRequest("http://localhost/api/payments/one-click-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId: "booking-001" }),
    });

    const response = await oneClickBookingPost(request);
    expect(response.status).toBe(409);

    const payload = await response.json();
    expect(payload.errorCode).toBe("ONE_CLICK_REQUIRES_ACTION");
    expect(payload.details).toMatchObject({
      paymentIntentId: "pi_requires_action_001",
      status: "requires_action",
      clientSecret: "pi_requires_action_001_secret_abc",
    });
  });

  it("returns card declined taxonomy when default payment method is declined", async () => {
    stripeMock.paymentIntents.create.mockRejectedValueOnce({
      type: "StripeCardError",
      code: "card_declined",
      decline_code: "insufficient_funds",
    });

    const request = new NextRequest("http://localhost/api/payments/one-click-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId: "booking-001" }),
    });

    const response = await oneClickBookingPost(request);
    expect(response.status).toBe(402);

    const payload = await response.json();
    expect(payload.errorCode).toBe("ONE_CLICK_CARD_DECLINED");
    expect(payload.details).toMatchObject({
      declineCode: "insufficient_funds",
    });
  });

  it("returns requires-action taxonomy when payment intent comes back in requires_action state", async () => {
    stripeMock.paymentIntents.create.mockResolvedValueOnce(
      {
        id: "pi_requires_action_200",
        status: "requires_action",
        client_secret: "pi_requires_action_200_secret_xyz",
      } as {
        id: string;
        status: string;
        client_secret: string;
      },
    );

    const request = new NextRequest("http://localhost/api/payments/one-click-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId: "booking-001" }),
    });

    const response = await oneClickBookingPost(request);
    expect(response.status).toBe(409);

    const payload = await response.json();
    expect(payload.errorCode).toBe("ONE_CLICK_REQUIRES_ACTION");
    expect(payload.details).toMatchObject({
      paymentIntentId: "pi_requires_action_200",
      status: "requires_action",
      clientSecret: "pi_requires_action_200_secret_xyz",
    });
  });

  it("returns requires-action taxonomy even when payment_intent metadata is missing", async () => {
    stripeMock.paymentIntents.create.mockRejectedValueOnce({
      code: "authentication_required",
    });

    const request = new NextRequest("http://localhost/api/payments/one-click-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId: "booking-001" }),
    });

    const response = await oneClickBookingPost(request);
    expect(response.status).toBe(409);

    const payload = await response.json();
    expect(payload.errorCode).toBe("ONE_CLICK_REQUIRES_ACTION");
  });

  it("returns payment already completed when latest payment is already succeeded", async () => {
    prismaMock.payment.findFirst.mockResolvedValueOnce({
      id: "payment-complete-001",
      status: "succeeded",
      stripePaymentId: "pi_done_001",
    });

    const request = new NextRequest("http://localhost/api/payments/one-click-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId: "booking-001" }),
    });

    const response = await oneClickBookingPost(request);
    expect(response.status).toBe(409);

    const payload = await response.json();
    expect(payload.errorCode).toBe("PAYMENT_ALREADY_COMPLETED");
  });

  it("returns default payment method required when customer has no default card", async () => {
    stripeMock.customers.retrieve.mockResolvedValueOnce({
      id: "cus_existing_001",
      deleted: false,
      invoice_settings: { default_payment_method: null },
    });

    const request = new NextRequest("http://localhost/api/payments/one-click-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId: "booking-001" }),
    });

    const response = await oneClickBookingPost(request);
    expect(response.status).toBe(409);

    const payload = await response.json();
    expect(payload.errorCode).toBe("DEFAULT_PAYMENT_METHOD_REQUIRED");
  });

  it("returns customer record unavailable when Stripe customer is deleted", async () => {
    stripeMock.customers.retrieve.mockResolvedValueOnce({
      id: "cus_deleted_001",
      deleted: true,
      invoice_settings: { default_payment_method: null },
    });

    const request = new NextRequest("http://localhost/api/payments/one-click-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId: "booking-001" }),
    });

    const response = await oneClickBookingPost(request);
    expect(response.status).toBe(409);

    const payload = await response.json();
    expect(payload.errorCode).toBe("CUSTOMER_RECORD_UNAVAILABLE");
  });

  it("returns booking access denied when booking belongs to another user", async () => {
    prismaMock.booking.findUnique.mockResolvedValueOnce({
      id: "booking-001",
      userId: "user-999",
      bookingNumber: "PB-20260513-0001",
      total: 220,
      status: "pending",
      checkInDate: new Date("2026-06-01T15:00:00.000Z"),
      checkOutDate: new Date("2026-06-03T10:00:00.000Z"),
      user: { email: "owner@example.com" },
    });

    const request = new NextRequest("http://localhost/api/payments/one-click-booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId: "booking-001" }),
    });

    const response = await oneClickBookingPost(request);
    expect(response.status).toBe(403);

    const payload = await response.json();
    expect(payload.errorCode).toBe("BOOKING_ACCESS_DENIED");
  });
});
