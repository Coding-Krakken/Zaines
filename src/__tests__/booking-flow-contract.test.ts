import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authMock,
  stripeMock,
  prismaMock,
  sendPaymentNotificationMock,
  paymentState,
} = vi.hoisted(() => {
  const state = {
    paymentStatus: "pending" as "pending" | "succeeded",
  };

  return {
    authMock: vi.fn(async () => ({ user: { id: "user-001" } })),
    stripeMock: {
      paymentIntents: {
        create: vi.fn(async () => ({
          id: "pi_contract_001",
          client_secret: "secret_contract_001",
        })),
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
    },
    prismaMock: {
      $transaction: vi.fn(
        async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
          const tx = {
            $executeRaw: vi.fn(async () => undefined),
            booking: {
              count: vi.fn(async () => 0),
              create: vi.fn(async () => ({
                id: "booking-contract-001",
                bookingNumber: "PB-20260504-0001",
                checkInDate: "2026-06-10T00:00:00.000Z",
                checkOutDate: "2026-06-13T00:00:00.000Z",
                subtotal: 255,
                tax: 25.5,
                total: 280.5,
                status: "pending",
                userId: "user-001",
                suite: {
                  id: "suite-001",
                  name: "Deluxe Suite",
                  tier: "deluxe",
                  pricePerNight: 85,
                },
              })),
            },
            suite: {
              findFirst: vi.fn(async () => ({ id: "suite-001" })),
            },
            user: {
              findUnique: vi.fn(async () => ({ id: "user-001" })),
              upsert: vi.fn(async () => ({ id: "user-001" })),
            },
          };

          return callback(tx);
        },
      ),
      payment: {
        findFirst: vi.fn(async (args?: { where?: { stripePaymentId?: string } }) => {
          if (args?.where?.stripePaymentId) {
            return {
              id: "payment-001",
              bookingId: "booking-contract-001",
              stripePaymentId: args.where.stripePaymentId,
              status: state.paymentStatus,
            };
          }

          return null;
        }),
        create: vi.fn(async () => ({ id: "payment-001" })),
        updateMany: vi.fn(async (args?: { data?: { status?: string } }) => {
          if (args?.data?.status === "succeeded") {
            state.paymentStatus = "succeeded";
          }
          return { count: 1 };
        }),
      },
      booking: {
        update: vi.fn(async () => ({ id: "booking-contract-001" })),
        findUnique: vi.fn(async () => ({
          id: "booking-contract-001",
          bookingNumber: "PB-20260504-0001",
          user: { email: "owner@example.com" },
        })),
        findMany: vi.fn(async () => []),
      },
    },
    sendPaymentNotificationMock: vi.fn(async () => ({ sent: true })),
    paymentState: state,
  };
});

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/stripe", () => ({
  stripe: stripeMock,
  formatAmountForStripe: (amount: number) => Math.round(amount * 100),
  isStripeConfigured: vi.fn(() => true),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  isDatabaseConfigured: vi.fn(() => true),
}));
vi.mock("@/lib/notifications", () => ({
  sendBookingConfirmation: vi.fn(async () => undefined),
  sendPaymentNotification: sendPaymentNotificationMock,
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (name: string) => (name === "stripe-signature" ? "sig_test" : null),
  })),
}));

import { POST as validateBooking } from "@/app/api/bookings/validate/route";
import { POST as createBooking } from "@/app/api/bookings/route";
import { POST as webhookRoute } from "@/app/api/payments/webhook/route";

describe("booking flow contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paymentState.paymentStatus = "pending";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_contract";
  });

  it("keeps quote totals and created booking totals consistent", async () => {
    const quoteRequest = new NextRequest("http://localhost/api/bookings/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkIn: "2026-06-10",
        checkOut: "2026-06-13",
        suiteType: "deluxe",
        petCount: 1,
      }),
    });

    const quoteResponse = await validateBooking(quoteRequest);
    const quoteBody = await quoteResponse.json();

    expect(quoteResponse.status).toBe(200);
    expect(quoteBody.pricing.total).toBe(280.5);

    const bookingRequest = new NextRequest("http://localhost/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkIn: "2026-06-10",
        checkOut: "2026-06-13",
        suiteType: "deluxe",
        petCount: 1,
        firstName: "Morgan",
        lastName: "Lee",
        email: "morgan@example.com",
        phone: "3155551234",
        petNames: "Scout",
        specialRequests: "Window side if possible",
        addOns: [],
        waiver: {
          liabilityAccepted: true,
          medicalAuthorizationAccepted: true,
          photoReleaseAccepted: true,
          signature: "Morgan Lee",
        },
      }),
    });

    const bookingResponse = await createBooking(bookingRequest);
    const bookingBody = await bookingResponse.json();

    expect(bookingResponse.status).toBe(201);
    expect(bookingBody.pricing.total).toBe(quoteBody.pricing.total);
    expect(bookingBody.pricing.subtotal).toBe(quoteBody.pricing.subtotal);
    expect(bookingBody.pricing.tax).toBe(quoteBody.pricing.tax);
    expect(bookingBody.payment.clientSecret).toBe("secret_contract_001");
  });

  it("handles duplicate payment_intent.succeeded webhook events idempotently", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_contract_001",
          metadata: { bookingId: "booking-contract-001" },
        },
      },
    });

    const first = await webhookRoute(
      new NextRequest("http://localhost/api/payments/webhook", {
        method: "POST",
        body: JSON.stringify({ type: "payment_intent.succeeded" }),
      }),
    );
    expect(first.status).toBe(200);

    const second = await webhookRoute(
      new NextRequest("http://localhost/api/payments/webhook", {
        method: "POST",
        body: JSON.stringify({ type: "payment_intent.succeeded" }),
      }),
    );
    expect(second.status).toBe(200);

    expect(sendPaymentNotificationMock).toHaveBeenCalledTimes(1);
  });
});
