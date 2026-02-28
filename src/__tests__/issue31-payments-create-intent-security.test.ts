import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type SessionLike = { user: { id: string } } | null;

const { authMock, prismaMock, stripeMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn<() => Promise<SessionLike>>(async () => null),
    prismaMock: {
      booking: {
        findUnique: vi.fn(async () => ({
          id: "booking-001",
          userId: "user-001",
          bookingNumber: "PB-20260227-0001",
          total: 99,
          user: { email: "owner@example.com" },
        })),
      },
      payment: {
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => ({ id: "payment-001" })),
      },
    },
    stripeMock: {
      paymentIntents: {
        create: vi.fn(async () => ({
          id: "pi_001",
          client_secret: "secret_001",
        })),
      },
    },
  };
});

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  isDatabaseConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: stripeMock,
  formatAmountForStripe: vi.fn((amount: number) => Math.round(amount * 100)),
  isStripeConfigured: vi.fn(() => true),
}));

import { POST as createIntent } from "@/app/api/payments/create-intent/route";

describe("Issue #31 CP2 create-intent security remediation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(null as SessionLike);
    prismaMock.booking.findUnique.mockResolvedValue({
      id: "booking-001",
      userId: "user-001",
      bookingNumber: "PB-20260227-0001",
      total: 99,
      user: { email: "owner@example.com" },
    });
    prismaMock.payment.findFirst.mockResolvedValue(null);
  });

  it("requires authentication before processing create-intent", async () => {
    const request = new Request(
      "http://localhost:3000/api/payments/create-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-correlation-id": "issue31-payment-auth",
        },
        body: JSON.stringify({
          bookingId: "booking-001",
          amount: 99,
        }),
      },
    );

    const response = await createIntent(request as NextRequest);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual(
      expect.objectContaining({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
        correlationId: "issue31-payment-auth",
      }),
    );
    expect(prismaMock.booking.findUnique).not.toHaveBeenCalled();
  });

  it("returns redacted deterministic validation envelope", async () => {
    authMock.mockResolvedValue({ user: { id: "user-001" } } as SessionLike);

    const request = new Request(
      "http://localhost:3000/api/payments/create-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-correlation-id": "issue31-payment-validation",
        },
        body: JSON.stringify({
          bookingId: "",
        }),
      },
    );

    const response = await createIntent(request as NextRequest);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual(
      expect.objectContaining({
        error: "Invalid payment data",
        code: "PAYMENT_VALIDATION_ERROR",
        correlationId: "issue31-payment-validation",
        details: {
          fields: ["amount"],
        },
      }),
    );
    expect(payload.details).not.toHaveProperty("issues");
    expect(payload.details).not.toHaveProperty("name");
  });

  it("enforces strict booking ownership for authenticated users", async () => {
    authMock.mockResolvedValue({ user: { id: "user-002" } } as SessionLike);

    const request = new Request(
      "http://localhost:3000/api/payments/create-intent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: "booking-001",
          amount: 99,
        }),
      },
    );

    const response = await createIntent(request as NextRequest);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual(
      expect.objectContaining({
        error: "Unauthorized - this booking belongs to another user",
      }),
    );
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
    expect(prismaMock.payment.create).not.toHaveBeenCalled();
  });
});
