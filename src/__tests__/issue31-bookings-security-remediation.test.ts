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

describe("Issue #31 CP2 booking security remediation", () => {
  it("returns redacted deterministic validation envelope", async () => {
    const request = new Request("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-correlation-id": "issue31-booking-correlation",
      },
      body: JSON.stringify({
        checkIn: "2026-03-10",
      }),
    });

    const response = await createBooking(request as NextRequest);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual(
      expect.objectContaining({
        error: "Invalid booking data",
        code: "BOOKING_VALIDATION_ERROR",
        correlationId: "issue31-booking-correlation",
        details: {
          fields: expect.arrayContaining([
            "checkOut",
            "email",
            "firstName",
            "waiver",
          ]),
        },
      }),
    );
    expect(payload.details).not.toHaveProperty("issues");
    expect(payload.details).not.toHaveProperty("name");
  });
});
