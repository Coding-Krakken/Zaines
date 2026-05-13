import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authMock,
  userFindUniqueMock,
  userUpdateMock,
  isDatabaseConfiguredMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  userUpdateMock: vi.fn(),
  isDatabaseConfiguredMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: userFindUniqueMock,
      update: userUpdateMock,
    },
  },
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

import { GET, PUT } from "@/app/api/profile/preferences/route";

function makePutRequest(body: unknown) {
  return new NextRequest("http://localhost/api/profile/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("profile preferences route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDatabaseConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("returns preferences and last login timestamp", async () => {
    const lastLoginAt = new Date("2026-05-13T12:00:00.000Z");
    userFindUniqueMock.mockResolvedValueOnce({
      bookingStatusEmailsEnabled: true,
      productUpdatesEmailsEnabled: false,
      marketingEmailsEnabled: true,
      lastLoginAt,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preferences).toEqual({
      bookingStatusEmailsEnabled: true,
      productUpdatesEmailsEnabled: false,
      marketingEmailsEnabled: true,
    });
    expect(body.lastLoginAt).toBe("2026-05-13T12:00:00.000Z");
  });

  it("returns 503 when database is unavailable", async () => {
    isDatabaseConfiguredMock.mockReturnValueOnce(false);

    const response = await GET();

    expect(response.status).toBe(503);
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("rejects invalid payloads", async () => {
    const response = await PUT(
      makePutRequest({
        bookingStatusEmailsEnabled: true,
        productUpdatesEmailsEnabled: "yes",
        marketingEmailsEnabled: true,
      }),
    );

    expect(response.status).toBe(422);
    expect(userUpdateMock).not.toHaveBeenCalled();
  });

  it("updates preferences for authenticated user", async () => {
    userUpdateMock.mockResolvedValueOnce({
      bookingStatusEmailsEnabled: false,
      productUpdatesEmailsEnabled: true,
      marketingEmailsEnabled: false,
      lastLoginAt: null,
    });

    const response = await PUT(
      makePutRequest({
        bookingStatusEmailsEnabled: false,
        productUpdatesEmailsEnabled: true,
        marketingEmailsEnabled: false,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        bookingStatusEmailsEnabled: false,
        productUpdatesEmailsEnabled: true,
        marketingEmailsEnabled: false,
      },
      select: {
        bookingStatusEmailsEnabled: true,
        productUpdatesEmailsEnabled: true,
        marketingEmailsEnabled: true,
        lastLoginAt: true,
      },
    });
    expect(body.preferences.marketingEmailsEnabled).toBe(false);
    expect(body.lastLoginAt).toBeNull();
  });

  it("returns 503 on put when database is unavailable", async () => {
    isDatabaseConfiguredMock.mockReturnValueOnce(false);

    const response = await PUT(
      makePutRequest({
        bookingStatusEmailsEnabled: false,
        productUpdatesEmailsEnabled: true,
        marketingEmailsEnabled: false,
      }),
    );

    expect(response.status).toBe(503);
  });

  it("returns 401 on put when unauthenticated", async () => {
    authMock.mockResolvedValueOnce(null);

    const response = await PUT(
      makePutRequest({
        bookingStatusEmailsEnabled: false,
        productUpdatesEmailsEnabled: true,
        marketingEmailsEnabled: false,
      }),
    );

    expect(response.status).toBe(401);
  });
});
