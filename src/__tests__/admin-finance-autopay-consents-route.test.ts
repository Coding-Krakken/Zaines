import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { authMock, isDatabaseConfiguredMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  isDatabaseConfiguredMock: vi.fn(() => true),
  prismaMock: {
    settings: {
      findMany: vi.fn<
        () => Promise<Array<{ key: string; value: string; updatedAt: Date }>>
      >(async () => []),
    },
    user: {
      findMany: vi.fn<
        () => Promise<Array<{ id: string; name: string | null; email: string | null }>>
      >(async () => []),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

import { GET as getAutopayConsentsRoute } from "@/app/api/admin/finance/autopay-consents/route";

function makeRequest() {
  return new NextRequest("http://localhost/api/admin/finance/autopay-consents", {
    method: "GET",
    headers: {
      "x-correlation-id": "autopay-consents-test-cid",
    },
  });
}

describe("admin finance autopay-consents route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDatabaseConfiguredMock.mockReturnValue(true);
  });

  it("rejects unauthenticated callers", async () => {
    authMock.mockResolvedValueOnce(null);

    const response = await getAutopayConsentsRoute(makeRequest());
    expect(response.status).toBe(401);
  });

  it("rejects non-finance roles", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1", role: "customer", name: "Customer" },
    });

    const response = await getAutopayConsentsRoute(makeRequest());
    expect(response.status).toBe(403);
  });

  it("returns aggregated consent totals for staff", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "staff-1", role: "staff", name: "Staff" },
    });
    prismaMock.settings.findMany.mockResolvedValueOnce([
      {
        key: "payments.autopay_consent.user-001",
        value: JSON.stringify({ enabled: true, allowIncidentals: true }),
        updatedAt: new Date("2026-05-13T10:00:00.000Z"),
      },
      {
        key: "payments.autopay_consent.user-002",
        value: JSON.stringify({ enabled: false, allowIncidentals: false }),
        updatedAt: new Date("2026-05-13T09:00:00.000Z"),
      },
      {
        key: "payments.autopay_consent.user-003",
        value: "not-json",
        updatedAt: new Date("2026-05-13T08:00:00.000Z"),
      },
    ]);
    prismaMock.user.findMany.mockResolvedValueOnce([
      { id: "user-001", name: "Ada Lovelace", email: "ada@example.com" },
      { id: "user-002", name: "Grace Hopper", email: "grace@example.com" },
    ]);

    const response = await getAutopayConsentsRoute(makeRequest());
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.data.totals).toMatchObject({
      profiles: 3,
      enabled: 1,
      incidentalsAuthorized: 1,
    });
    expect(prismaMock.settings.findMany).toHaveBeenCalledWith({
      where: {
        key: {
          startsWith: "payments.autopay_consent.",
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["user-001", "user-002", "user-003"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    expect(payload.data.rows[0]).toMatchObject({
      userId: "user-001",
      customerName: "Ada Lovelace",
      customerEmail: "ada@example.com",
      bookingsSearchHref: "/admin/bookings?search=ada%40example.com",
      enabled: true,
      allowIncidentals: true,
    });
    expect(payload.data.rows[2]).toMatchObject({
      userId: "user-003",
      customerName: null,
      customerEmail: null,
      bookingsSearchHref: "/admin/bookings?search=user-003",
      enabled: false,
      allowIncidentals: false,
    });
  });

  it("returns 503 when database is unavailable", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "admin-1", role: "admin", name: "Admin" },
    });
    isDatabaseConfiguredMock.mockReturnValueOnce(false);

    const response = await getAutopayConsentsRoute(makeRequest());
    expect(response.status).toBe(503);
  });
});
