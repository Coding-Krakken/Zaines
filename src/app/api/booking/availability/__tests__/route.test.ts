import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

let suiteCount = 3;
let bookingCount = 0;

vi.mock("@/lib/prisma", () => ({
  prisma: {
    suite: { count: vi.fn(async () => suiteCount) },
    booking: { count: vi.fn(async () => bookingCount) },
    settings: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn(), findMany: vi.fn() },
  },
  isDatabaseConfigured: vi.fn(() => true),
}));

describe("POST /api/booking/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    suiteCount = 3;
    bookingCount = 0;
  });

  it("returns INVALID_DATE_RANGE for invalid date ordering", async () => {
    const request = new NextRequest("http://localhost:3000/api/booking/availability", {
      method: "POST",
      body: JSON.stringify({ checkIn: "2026-03-10", checkOut: "2026-03-09", serviceType: "boarding", partySize: 1 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errorCode).toBe("INVALID_DATE_RANGE");
  });

  it("returns NO_CAPACITY when suites are full", async () => {
    suiteCount = 1;
    bookingCount = 1;

    const request = new NextRequest("http://localhost:3000/api/booking/availability", {
      method: "POST",
      body: JSON.stringify({ checkIn: "2026-03-10", checkOut: "2026-03-12", serviceType: "boarding", partySize: 1 }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isAvailable).toBe(false);
    expect(data.reasonCode).toBe("NO_CAPACITY");
  });
});