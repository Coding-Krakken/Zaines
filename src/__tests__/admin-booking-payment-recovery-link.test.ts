import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  authMock,
  prismaMock,
  isDatabaseConfiguredMock,
  sendPaymentRecoveryLinkNotificationMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    booking: {
      findUnique: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
  },
  isDatabaseConfiguredMock: vi.fn(() => true),
  sendPaymentRecoveryLinkNotificationMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  isDatabaseConfigured: isDatabaseConfiguredMock,
}));

vi.mock("@/lib/notifications", () => ({
  sendPaymentRecoveryLinkNotification: sendPaymentRecoveryLinkNotificationMock,
}));

import { POST } from "@/app/api/admin/bookings/[id]/payment-recovery-link/route";

function makeRequest() {
  return new NextRequest("http://localhost/api/admin/bookings/book-1/payment-recovery-link", {
    method: "POST",
  });
}

describe("POST /api/admin/bookings/[id]/payment-recovery-link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDatabaseConfiguredMock.mockReturnValue(true);
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "book-1" }) });

    expect(res.status).toBe(401);
  });

  it("returns 403 for non-staff role", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1", role: "customer" } });

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "book-1" }) });

    expect(res.status).toBe(403);
  });

  it("returns 404 when booking does not exist", async () => {
    authMock.mockResolvedValue({ user: { id: "staff-1", role: "staff" } });
    prismaMock.booking.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "book-1" }) });

    expect(res.status).toBe(404);
  });

  it("sends recovery link and writes staff message", async () => {
    authMock.mockResolvedValue({
      user: { id: "staff-1", role: "staff", name: "Agent Smith" },
    });

    prismaMock.booking.findUnique.mockResolvedValue({
      id: "book-1",
      bookingNumber: "PB-001",
      user: {
        id: "cust-1",
        name: "Jane Customer",
        email: "jane@example.com",
      },
    });

    sendPaymentRecoveryLinkNotificationMock.mockResolvedValue({
      sent: true,
      provider: "resend",
    });

    prismaMock.message.create.mockResolvedValue({ id: "msg-1" });

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "book-1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.recoveryUrl).toContain("/book/recover/book-1");
    expect(sendPaymentRecoveryLinkNotificationMock).toHaveBeenCalledTimes(1);
    expect(prismaMock.message.create).toHaveBeenCalledTimes(1);
  });
});
