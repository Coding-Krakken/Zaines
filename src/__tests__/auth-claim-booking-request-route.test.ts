import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  bookingFindFirstMock,
  bookingClaimTokenDeleteManyMock,
  bookingClaimTokenCreateMock,
  isDatabaseConfiguredMock,
  sendBookingClaimNotificationMock,
  logSecurityEventMock,
} = vi.hoisted(() => ({
  bookingFindFirstMock: vi.fn(),
  bookingClaimTokenDeleteManyMock: vi.fn(),
  bookingClaimTokenCreateMock: vi.fn(),
  isDatabaseConfiguredMock: vi.fn(),
  sendBookingClaimNotificationMock: vi.fn(),
  logSecurityEventMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: {
      findFirst: bookingFindFirstMock,
    },
    bookingClaimToken: {
      deleteMany: bookingClaimTokenDeleteManyMock,
      create: bookingClaimTokenCreateMock,
    },
  },
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

vi.mock("@/lib/notifications", () => ({
  sendBookingClaimNotification: sendBookingClaimNotificationMock,
}));

vi.mock("@/lib/security/logging", () => ({
  logSecurityEvent: logSecurityEventMock,
}));

import { POST } from "@/app/api/auth/claim-booking/request/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/claim-booking/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-correlation-id": "claim-request-test",
    },
    body: JSON.stringify(body),
  });
}

describe("claim booking request route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDatabaseConfiguredMock.mockReturnValue(true);
    bookingClaimTokenDeleteManyMock.mockResolvedValue({ count: 1 });
    bookingClaimTokenCreateMock.mockResolvedValue({ id: "token-1" });
    sendBookingClaimNotificationMock.mockResolvedValue(undefined);
  });

  it("returns 422 for invalid payload", async () => {
    const response = await POST(makeRequest({ bookingNumber: "", email: "not-an-email" }));

    expect(response.status).toBe(422);
  });

  it("returns accepted when booking is not found", async () => {
    bookingFindFirstMock.mockResolvedValueOnce(null);

    const response = await POST(
      makeRequest({ bookingNumber: "bk-1234", email: "owner@example.com" }),
    );

    expect(response.status).toBe(202);
    expect(bookingClaimTokenCreateMock).not.toHaveBeenCalled();
    expect(sendBookingClaimNotificationMock).not.toHaveBeenCalled();
  });

  it("returns accepted when database is unavailable", async () => {
    isDatabaseConfiguredMock.mockReturnValueOnce(false);

    const response = await POST(
      makeRequest({ bookingNumber: "bk-1234", email: "owner@example.com" }),
    );

    expect(response.status).toBe(202);
  });

  it("creates token and sends claim notification when booking is found", async () => {
    bookingFindFirstMock.mockResolvedValueOnce({
      id: "booking-1",
      bookingNumber: "BK-1234",
      user: {
        name: "Alex Owner",
      },
    });

    const response = await POST(
      makeRequest({ bookingNumber: "bk-1234", email: "owner@example.com" }),
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.state).toBe("accepted");
    expect(bookingClaimTokenDeleteManyMock).toHaveBeenCalledWith({
      where: { bookingId: "booking-1", claimedAt: null },
    });
    expect(bookingClaimTokenCreateMock).toHaveBeenCalledWith({
      data: {
        bookingId: "booking-1",
        email: "owner@example.com",
        token: expect.any(String),
        expiresAt: expect.any(Date),
      },
    });
    expect(sendBookingClaimNotificationMock).toHaveBeenCalledWith({
      email: "owner@example.com",
      claimUrl: expect.stringContaining("/auth/claim-booking?token="),
      bookingNumber: "BK-1234",
      firstName: "Alex",
    });
  });
});
