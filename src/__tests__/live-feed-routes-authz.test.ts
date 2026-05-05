import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { authMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    bookingPet: {
      findUnique: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
    petPhoto: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  isDatabaseConfigured: vi.fn(() => true),
}));

import { POST as postActivity } from "@/app/api/bookings/[id]/activities/route";
import { POST as postPhoto } from "@/app/api/bookings/[id]/photos/route";

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeJsonRequest(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("live-feed write routes authz", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin role to create activities", async () => {
    authMock.mockResolvedValue({ user: { id: "staff-1", role: "admin", name: "Admin" } });
    prismaMock.bookingPet.findUnique.mockResolvedValue({ bookingId: "booking-1" });
    prismaMock.activity.create.mockResolvedValue({ id: "activity-1" });

    const response = await postActivity(
      makeJsonRequest("http://localhost/api/bookings/booking-1/activities", {
        petId: "pet-1",
        type: "feeding",
      }),
      ctx("booking-1")
    );

    expect(response.status).toBe(201);
    expect(prismaMock.activity.create).toHaveBeenCalledTimes(1);
  });

  it("rejects activity creation when pet is not part of booking", async () => {
    authMock.mockResolvedValue({ user: { id: "staff-1", role: "staff", name: "Staff" } });
    prismaMock.bookingPet.findUnique.mockResolvedValue(null);

    const response = await postActivity(
      makeJsonRequest("http://localhost/api/bookings/booking-1/activities", {
        petId: "pet-unknown",
        type: "walk",
      }),
      ctx("booking-1")
    );

    expect(response.status).toBe(400);
    expect(prismaMock.activity.create).not.toHaveBeenCalled();
  });

  it("allows admin role to create photos", async () => {
    authMock.mockResolvedValue({ user: { id: "staff-1", role: "admin", name: "Admin" } });
    prismaMock.bookingPet.findUnique.mockResolvedValue({ bookingId: "booking-1" });
    prismaMock.petPhoto.create.mockResolvedValue({ id: "photo-1" });

    const response = await postPhoto(
      makeJsonRequest("http://localhost/api/bookings/booking-1/photos", {
        petId: "pet-1",
        imageUrl: "https://example.test/photo.jpg",
      }),
      ctx("booking-1")
    );

    expect(response.status).toBe(201);
    expect(prismaMock.petPhoto.create).toHaveBeenCalledTimes(1);
  });

  it("rejects photo creation when pet is not part of booking", async () => {
    authMock.mockResolvedValue({ user: { id: "staff-1", role: "staff", name: "Staff" } });
    prismaMock.bookingPet.findUnique.mockResolvedValue(null);

    const response = await postPhoto(
      makeJsonRequest("http://localhost/api/bookings/booking-1/photos", {
        petId: "pet-unknown",
        imageUrl: "https://example.test/photo.jpg",
      }),
      ctx("booking-1")
    );

    expect(response.status).toBe(400);
    expect(prismaMock.petPhoto.create).not.toHaveBeenCalled();
  });
});
