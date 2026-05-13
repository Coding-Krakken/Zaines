import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authMock,
  bookingClaimTokenFindUniqueMock,
  bookingClaimTokenUpdateMock,
  bookingFindUniqueMock,
  bookingUpdateMock,
  petUpdateManyMock,
  isDatabaseConfiguredMock,
  logSecurityEventMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  bookingClaimTokenFindUniqueMock: vi.fn(),
  bookingClaimTokenUpdateMock: vi.fn(),
  bookingFindUniqueMock: vi.fn(),
  bookingUpdateMock: vi.fn(),
  petUpdateManyMock: vi.fn(),
  isDatabaseConfiguredMock: vi.fn(),
  logSecurityEventMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bookingClaimToken: {
      findUnique: bookingClaimTokenFindUniqueMock,
      update: bookingClaimTokenUpdateMock,
    },
    booking: {
      findUnique: bookingFindUniqueMock,
      update: bookingUpdateMock,
    },
    pet: {
      updateMany: petUpdateManyMock,
    },
  },
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

vi.mock("@/lib/security/logging", () => ({
  logSecurityEvent: logSecurityEventMock,
}));

import { POST } from "@/app/api/auth/claim-booking/confirm/route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/claim-booking/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-correlation-id": "claim-confirm-test",
    },
    body: JSON.stringify(body),
  });
}

describe("claim booking confirm route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDatabaseConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ user: { id: "user-1", email: "new@example.com" } });
  });

  it("returns 401 when user is unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null);

    const response = await POST(makeRequest({ token: "a".repeat(32) }));

    expect(response.status).toBe(401);
  });

  it("returns 422 for invalid payload", async () => {
    const response = await POST(makeRequest({ token: "short" }));

    expect(response.status).toBe(422);
  });

  it("returns 422 when claim token is expired", async () => {
    bookingClaimTokenFindUniqueMock.mockResolvedValueOnce({
      id: "token-1",
      bookingId: "booking-1",
      email: "new@example.com",
      expiresAt: new Date(Date.now() - 60_000),
      claimedAt: null,
    });

    const response = await POST(makeRequest({ token: "a".repeat(32) }));

    expect(response.status).toBe(422);
  });

  it("returns 403 when token email does not match signed-in account", async () => {
    bookingClaimTokenFindUniqueMock.mockResolvedValueOnce({
      id: "token-1",
      bookingId: "booking-1",
      email: "other@example.com",
      expiresAt: new Date(Date.now() + 60_000),
      claimedAt: null,
    });

    const response = await POST(makeRequest({ token: "a".repeat(32) }));

    expect(response.status).toBe(403);
    expect(logSecurityEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "AUTH_BOOKING_CLAIM_CONFIRM_EMAIL_MISMATCH",
        level: "warn",
      }),
    );
  });

  it("claims booking and reassigns pets on success", async () => {
    bookingClaimTokenFindUniqueMock.mockResolvedValueOnce({
      id: "token-1",
      bookingId: "booking-1",
      email: "new@example.com",
      expiresAt: new Date(Date.now() + 60_000),
      claimedAt: null,
    });
    bookingFindUniqueMock.mockResolvedValueOnce({
      id: "booking-1",
      userId: "user-old",
      bookingNumber: "BK-1234",
      bookingPets: [{ petId: "pet-1" }, { petId: "pet-2" }],
    });

    const response = await POST(makeRequest({ token: "a".repeat(32) }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.state).toBe("claimed");
    expect(body.bookingId).toBe("booking-1");
    expect(bookingUpdateMock).toHaveBeenCalledWith({
      where: { id: "booking-1" },
      data: { userId: "user-1" },
    });
    expect(petUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: { in: ["pet-1", "pet-2"] },
        userId: "user-old",
      },
      data: {
        userId: "user-1",
      },
    });
    expect(bookingClaimTokenUpdateMock).toHaveBeenCalledWith({
      where: { id: "token-1" },
      data: {
        claimedAt: expect.any(Date),
        claimedByUserId: "user-1",
      },
    });
  });
});
