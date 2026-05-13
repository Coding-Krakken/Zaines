import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as getBookingReceipt } from "@/app/api/bookings/[id]/receipt/route";

const { authMock, bookingFindUniqueMock, isDatabaseConfiguredMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    bookingFindUniqueMock: vi.fn(),
    isDatabaseConfiguredMock: vi.fn(),
  }),
);

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: {
      findUnique: bookingFindUniqueMock,
    },
  },
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

describe("booking receipt route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user-1", role: "customer" } });
    isDatabaseConfiguredMock.mockReturnValue(true);

    bookingFindUniqueMock.mockResolvedValue({
      id: "booking-1",
      userId: "user-1",
      bookingNumber: "PB-20260513-0001",
      status: "confirmed",
      checkInDate: new Date("2026-06-01T15:00:00.000Z"),
      checkOutDate: new Date("2026-06-05T10:00:00.000Z"),
      subtotal: 400,
      tax: 40,
      total: 440,
      updatedAt: new Date("2026-05-13T00:00:00.000Z"),
      user: {
        id: "user-1",
        name: "Alex Customer",
        email: "alex@example.com",
      },
      suite: {
        name: "Deluxe Suite",
        tier: "deluxe",
      },
      bookingPets: [{ pet: { name: "Bella" } }, { pet: { name: "Charlie" } }],
      payments: [
        {
          status: "succeeded",
          currency: "usd",
          paidAt: new Date("2026-05-13T01:00:00.000Z"),
          updatedAt: new Date("2026-05-13T01:00:00.000Z"),
        },
      ],
    });
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null);

    const request = new NextRequest("http://localhost:3000/api/bookings/booking-1/receipt");
    const response = await getBookingReceipt(request, {
      params: Promise.resolve({ id: "booking-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns receipt json for authorized user", async () => {
    const request = new NextRequest("http://localhost:3000/api/bookings/booking-1/receipt");
    const response = await getBookingReceipt(request, {
      params: Promise.resolve({ id: "booking-1" }),
    });

    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      receipt: {
        bookingId: string;
        bookingNumber: string;
        total: number;
        petNames: string[];
      };
    };

    expect(payload.receipt.bookingId).toBe("booking-1");
    expect(payload.receipt.bookingNumber).toBe("PB-20260513-0001");
    expect(payload.receipt.total).toBe(440);
    expect(payload.receipt.petNames).toEqual(["Bella", "Charlie"]);
  });

  it("returns branded html when format=html", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/bookings/booking-1/receipt?format=html",
    );
    const response = await getBookingReceipt(request, {
      params: Promise.resolve({ id: "booking-1" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const html = await response.text();
    expect(html).toContain("Luxury Boarding Invoice");
    expect(html).toContain("PB-20260513-0001");
    expect(html).toContain("Bella, Charlie");
  });

  it("returns 403 when booking belongs to another user", async () => {
    bookingFindUniqueMock.mockResolvedValueOnce({
      id: "booking-2",
      userId: "other-user",
      bookingNumber: "PB-20260513-0002",
      status: "confirmed",
      checkInDate: new Date("2026-06-10T15:00:00.000Z"),
      checkOutDate: new Date("2026-06-12T10:00:00.000Z"),
      subtotal: 120,
      tax: 12,
      total: 132,
      updatedAt: new Date("2026-05-13T00:00:00.000Z"),
      user: {
        id: "other-user",
        name: "Other User",
        email: "other@example.com",
      },
      suite: {
        name: "Standard Suite",
        tier: "standard",
      },
      bookingPets: [{ pet: { name: "Milo" } }],
      payments: [],
    });

    const request = new NextRequest("http://localhost:3000/api/bookings/booking-2/receipt");
    const response = await getBookingReceipt(request, {
      params: Promise.resolve({ id: "booking-2" }),
    });

    expect(response.status).toBe(403);
  });
});
