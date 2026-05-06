import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type SessionLike = { user: { id: string } } | null;

const { authMock, prismaMock, stripeMock } = vi.hoisted(() => ({
  authMock: vi.fn<() => Promise<SessionLike>>(async () => null),
  prismaMock: {
    booking: {
      findUnique: vi.fn(async () => ({
        id: "booking-001",
        userId: "user-001",
        bookingNumber: "PB-EXT-0001",
        total: 150,
        user: { email: "owner@example.com" },
      })),
    },
    payment: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async () => ({ id: "payment-ext-001" })),
    },
  },
  stripeMock: {
    paymentIntents: {
      create: vi.fn(async () => ({
        id: "pi_ext_001",
        client_secret: "secret_ext_001",
      })),
    },
  },
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  isDatabaseConfigured: vi.fn(() => true),
}));
vi.mock("@/lib/stripe", () => ({
  stripe: stripeMock,
  formatAmountForStripe: (amount: number) => Math.round(amount * 100),
  isStripeConfigured: vi.fn(() => true),
}));

import { POST as createIntent } from "@/app/api/payments/create-intent/route";

function buildRequest(body: unknown, correlationId = "ci-ext-test") {
  return new NextRequest("http://localhost/api/payments/create-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-correlation-id": correlationId,
    },
    body: JSON.stringify(body),
  });
}

describe("create-intent route – extended coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user-001" } });
  });

  it("returns 503 when Stripe is not configured", async () => {
    const { isStripeConfigured } = await import("@/lib/stripe");
    vi.mocked(isStripeConfigured).mockReturnValueOnce(false);

    const res = await createIntent(
      buildRequest({ bookingId: "booking-001", amount: 150 }),
    );
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.errorCode).toBe("PAYMENT_PROVIDER_UNAVAILABLE");
  });

  it("returns 503 when database is not configured", async () => {
    const { isDatabaseConfigured } = await import("@/lib/prisma");
    vi.mocked(isDatabaseConfigured).mockReturnValueOnce(false);

    const res = await createIntent(
      buildRequest({ bookingId: "booking-001", amount: 150 }),
    );
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.errorCode).toBe("PAYMENT_PERSISTENCE_UNAVAILABLE");
  });

  it("returns 401 when user is not authenticated", async () => {
    authMock.mockResolvedValueOnce(null);

    const res = await createIntent(
      buildRequest({ bookingId: "booking-001", amount: 150 }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("AUTH_REQUIRED");
  });

  it("returns 400 for invalid request body (missing fields)", async () => {
    const res = await createIntent(buildRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("PAYMENT_VALIDATION_ERROR");
  });

  it("returns 400 when amount is not positive", async () => {
    const res = await createIntent(
      buildRequest({ bookingId: "booking-001", amount: -50 }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("PAYMENT_VALIDATION_ERROR");
  });

  it("returns 404 when booking is not found", async () => {
    prismaMock.booking.findUnique.mockResolvedValueOnce(null as unknown as {
      id: string; userId: string; bookingNumber: string; total: number; user: { email: string };
    });

    const res = await createIntent(
      buildRequest({ bookingId: "missing-booking", amount: 150 }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when booking belongs to another user", async () => {
    prismaMock.booking.findUnique.mockResolvedValueOnce({
      id: "booking-001",
      userId: "other-user",
      bookingNumber: "PB-EXT-0001",
      total: 150,
      user: { email: "other@example.com" },
    });

    const res = await createIntent(
      buildRequest({ bookingId: "booking-001", amount: 150 }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when amount does not match booking total", async () => {
    const res = await createIntent(
      buildRequest({ bookingId: "booking-001", amount: 200 }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errorCode).toBe("PAYMENT_AMOUNT_MISMATCH");
  });

  it("returns 409 when payment already exists", async () => {
    prismaMock.payment.findFirst.mockResolvedValueOnce({ id: "existing-pay" } as unknown as null);

    const res = await createIntent(
      buildRequest({ bookingId: "booking-001", amount: 150 }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already exists/i);
  });

  it("returns 200 with clientSecret on success", async () => {
    const res = await createIntent(
      buildRequest({ bookingId: "booking-001", amount: 150 }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clientSecret).toBe("secret_ext_001");
    expect(body.paymentIntentId).toBe("pi_ext_001");
    expect(prismaMock.payment.create).toHaveBeenCalled();
  });

  it("returns 500 when stripe.paymentIntents.create throws", async () => {
    stripeMock.paymentIntents.create.mockRejectedValueOnce(
      new Error("Stripe API error"),
    );

    const res = await createIntent(
      buildRequest({ bookingId: "booking-001", amount: 150 }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.errorCode).toBe("PAYMENT_INTENT_CREATE_FAILED");
    expect(body.error).not.toContain("Stripe API error");
  });
});
