import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ── hoisted mocks ──────────────────────────────────────────────────────────
const { stripeMock, prismaMock, notificationsMock } = vi.hoisted(() => ({
  stripeMock: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    paymentIntents: { retrieve: vi.fn() },
  },
  prismaMock: {
    payment: {
      updateMany: vi.fn(async () => ({ count: 1 })),
      findFirst: vi.fn(async () => ({ id: "pay-001", bookingId: "book-001" })),
    },
    booking: {
      update: vi.fn(async () => ({ id: "book-001" })),
      findUnique: vi.fn(async () => ({
        id: "book-001",
        bookingNumber: "PB-WH-0001",
        status: "pending",
        user: { email: "user@example.com", name: "Test User" },
      })),
    },
  },
  notificationsMock: {
    sendPaymentNotification: vi.fn(async () => ({
      sent: true,
      provider: "dev-queue" as const,
    })),
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: stripeMock,
  isStripeConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  isDatabaseConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/notifications", () => notificationsMock);

// next/headers must be mocked before route import
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { POST as webhookHandler } from "@/app/api/payments/webhook/route";
import { headers as nextHeaders } from "next/headers";

const headersMock = nextHeaders as unknown as ReturnType<typeof vi.fn>;

function makeRequest(body = "{}") {
  const req = new NextRequest("http://localhost/api/payments/webhook", {
    method: "POST",
    body,
  });
  return req;
}

describe("webhook route – extended coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    // default: valid signature header present
    headersMock.mockResolvedValue({
      get: (name: string) =>
        name === "stripe-signature" ? "t=1,v1=abc" : null,
    });
  });

  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("returns 400 when Stripe is not configured", async () => {
    const { isStripeConfigured } = await import("@/lib/stripe");
    vi.mocked(isStripeConfigured).mockReturnValueOnce(false);
    const res = await webhookHandler(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/not available/i);
  });

  it("returns 400 when database is not configured", async () => {
    const { isDatabaseConfigured } = await import("@/lib/prisma");
    vi.mocked(isDatabaseConfigured).mockReturnValueOnce(false);
    const res = await webhookHandler(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/database/i);
  });

  it("returns 400 when STRIPE_WEBHOOK_SECRET is not set", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await webhookHandler(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/webhook/i);
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    headersMock.mockResolvedValue({ get: () => null });
    const res = await webhookHandler(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/stripe-signature/i);
  });

  it("returns 400 when signature verification fails", async () => {
    stripeMock.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error("No matching signature");
    });
    const res = await webhookHandler(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Webhook Error");
  });

  it("handles payment_intent.succeeded and returns 200", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_001",
          metadata: { bookingId: "book-001" },
        },
      },
    });

    const res = await webhookHandler(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(prismaMock.payment.updateMany).toHaveBeenCalled();
    expect(prismaMock.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "confirmed" }),
      }),
    );
  });

  it("handles payment_intent.payment_failed and returns 200", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_002",
          metadata: { bookingId: "book-001" },
        },
      },
    });

    const res = await webhookHandler(makeRequest());
    expect(res.status).toBe(200);
    expect(prismaMock.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "cancelled" }),
      }),
    );
  });

  it("handles payment_intent.canceled and returns 200", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: "payment_intent.canceled",
      data: {
        object: {
          id: "pi_003",
          metadata: { bookingId: "book-001" },
        },
      },
    });

    const res = await webhookHandler(makeRequest());
    expect(res.status).toBe(200);
    expect(prismaMock.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "cancelled" }),
      }),
    );
  });

  it("handles charge.refunded and returns 200", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_001",
          payment_intent: "pi_004",
        },
      },
    });

    const res = await webhookHandler(makeRequest());
    expect(res.status).toBe(200);
    expect(prismaMock.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "refunded" }),
      }),
    );
  });

  it("handles unknown event type gracefully", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: "customer.created",
      data: { object: {} },
    });

    const res = await webhookHandler(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });

  it("handles payment_intent.succeeded with missing bookingId gracefully", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_005",
          metadata: {},
        },
      },
    });

    const res = await webhookHandler(makeRequest());
    expect(res.status).toBe(200);
  });

  it("handles charge.refunded when payment_intent is an object", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_002",
          payment_intent: { id: "pi_006" },
        },
      },
    });

    const res = await webhookHandler(makeRequest());
    expect(res.status).toBe(200);
  });

  it("handles charge.refunded when payment_intent is null", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValueOnce({
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_003",
          payment_intent: null,
        },
      },
    });

    const res = await webhookHandler(makeRequest());
    expect(res.status).toBe(200);
  });
});
