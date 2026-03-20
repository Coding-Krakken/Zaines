import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type TransactionMock = {
  $executeRaw: () => Promise<undefined>;
  booking: {
    count: () => Promise<number>;
    create: () => Promise<{
      id: string;
      bookingNumber: string;
      checkInDate: string;
      checkOutDate: string;
      total: number;
      status: string;
      userId: string;
      suite: {
        id: string;
        name: string;
        tier: string;
        pricePerNight: number;
      };
    }>;
  };
  suite: {
    findFirst: () => Promise<{ id: string }>;
  };
  user: {
    findUnique: () => Promise<null>;
    upsert: () => Promise<{ id: string }>;
  };
};

const { prismaMock } = vi.hoisted(() => {
  const transactionBookingRecord = {
    id: "booking-issue31-001",
    bookingNumber: "PB-20260227-0001",
    checkInDate: "2026-03-10T00:00:00.000Z",
    checkOutDate: "2026-03-12T00:00:00.000Z",
    subtotal: 90,
    tax: 9,
    total: 99,
    status: "pending",
    userId: "user-001",
    suite: {
      id: "suite-001",
      name: "Luxury Private Suite",
      tier: "luxury",
      pricePerNight: 120,
    },
  };

  const mock = {
    $transaction: vi.fn(
      async (callback: (tx: TransactionMock) => Promise<unknown>) => {
        const tx: TransactionMock = {
          $executeRaw: vi.fn(async () => undefined),
          booking: {
            count: vi.fn(async () => 0),
            create: vi.fn(async () => transactionBookingRecord),
          },
          suite: {
            findFirst: vi.fn(async () => ({ id: "suite-001" })),
          },
          user: {
            findUnique: vi.fn(async () => null),
            upsert: vi.fn(async () => ({ id: "user-001" })),
          },
        };

        return callback(tx);
      },
    ),
    payment: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async () => ({ id: "payment-001" })),
    },
    booking: {
      findMany: vi.fn(async () => []),
    },
  };

  return { prismaMock: mock };
});

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => null),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  isDatabaseConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/notifications", () => ({
  sendBookingConfirmation: vi.fn(async () => undefined),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: null,
  formatAmountForStripe: vi.fn((amount: number) => Math.round(amount * 100)),
  isStripeConfigured: vi.fn(() => false),
}));

import { POST as createBooking } from "@/app/api/bookings/route";

describe("Issue #31 CP2 booking pricing disclosure contract", () => {
  it("returns required pricing breakdown fields and disclosure semantics", async () => {
    const request = new Request("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkIn: "2026-03-10",
        checkOut: "2026-03-12",
        suiteType: "luxury",
        petCount: 1,
        firstName: "Morgan",
        lastName: "Lee",
        email: "morgan@example.com",
        phone: "3155551234",
        petNames: "Scout",
        specialRequests: "Please send evening update.",
        waiver: {
          liabilityAccepted: true,
          medicalAuthorizationAccepted: true,
          photoReleaseAccepted: true,
          signature: "Morgan Lee",
        },
      }),
    });

    const response = await createBooking(request as NextRequest);
    const payload = await response.json();

    expect(response.status).toBe(201);

    expect(payload.pricing).toEqual(
      expect.objectContaining({
        subtotal: expect.any(Number),
        tax: expect.any(Number),
        total: expect.any(Number),
        currency: expect.any(String),
        pricingModelLabel: expect.any(String),
        disclosure: expect.any(String),
      }),
    );

    expect(payload.pricing.total).toBe(
      payload.pricing.subtotal + payload.pricing.tax,
    );
    expect(payload.pricing.disclosure.toLowerCase()).toContain(
      "before confirmation",
    );
    expect(payload.pricing.disclosure.toLowerCase()).toContain(
      "no hidden fees",
    );
  });
});
