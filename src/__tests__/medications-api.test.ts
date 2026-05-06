import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ── hoisted mocks ────────────────────────────────────────────────────────────
const { authMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    pet: {
      findUnique: vi.fn(),
    },
    medication: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  isDatabaseConfigured: vi.fn(() => true),
}));

import { POST as postMedication } from "@/app/api/medications/route";
import { DELETE as deleteMedication } from "@/app/api/medications/[id]/route";

const userSession = { user: { id: "user-1" } };
const userPet = { id: "pet-1", userId: "user-1", name: "Buddy" };
const otherPet = { id: "pet-2", userId: "user-2", name: "Max" };

const validMedicationBody = {
  name: "Carprofen",
  dosage: "75mg",
  frequency: "Twice daily",
  startDate: "2024-01-01T00:00:00Z",
  endDate: "2024-02-01T00:00:00Z",
  instructions: "Give with food",
  prescribedBy: "Dr. Smith",
};

const storedMedication = {
  id: "med-1",
  petId: "pet-1",
  ...validMedicationBody,
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-02-01"),
  pet: { id: "pet-1", name: "Buddy", userId: "user-1" },
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/medications", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ── POST /api/medications ─────────────────────────────────────────────────────
describe("POST /api/medications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await postMedication(
      makePostRequest({ petId: "pet-1", ...validMedicationBody }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when petId is missing", async () => {
    authMock.mockResolvedValue(userSession);
    const res = await postMedication(makePostRequest(validMedicationBody));
    expect(res.status).toBe(400);
  });

  it("returns 404 when pet not found", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findUnique.mockResolvedValue(null);
    const res = await postMedication(
      makePostRequest({ petId: "pet-1", ...validMedicationBody }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when pet belongs to another user", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findUnique.mockResolvedValue(otherPet);
    const res = await postMedication(
      makePostRequest({ petId: "pet-2", ...validMedicationBody }),
    );
    expect(res.status).toBe(403);
  });

  it("creates medication successfully", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findUnique.mockResolvedValue(userPet);
    prismaMock.medication.create.mockResolvedValue(storedMedication);
    const res = await postMedication(
      makePostRequest({ petId: "pet-1", ...validMedicationBody }),
    );
    expect(res.status).toBe(201);
    const data = (await res.json()) as { medication: typeof storedMedication };
    expect(data.medication.name).toBe("Carprofen");
  });
});

// ── DELETE /api/medications/[id] ──────────────────────────────────────────────
describe("DELETE /api/medications/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/medications/med-1", {
      method: "DELETE",
    });
    const res = await deleteMedication(req, ctx("med-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when medication not found", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.medication.findUnique.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/medications/med-1", {
      method: "DELETE",
    });
    const res = await deleteMedication(req, ctx("med-1"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when medication belongs to another user", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.medication.findUnique.mockResolvedValue({
      ...storedMedication,
      pet: { userId: "user-2" },
    });
    const req = new NextRequest("http://localhost/api/medications/med-1", {
      method: "DELETE",
    });
    const res = await deleteMedication(req, ctx("med-1"));
    expect(res.status).toBe(403);
  });

  it("deletes medication successfully", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.medication.findUnique.mockResolvedValue({
      ...storedMedication,
      pet: { userId: "user-1" },
    });
    prismaMock.medication.delete.mockResolvedValue(storedMedication);
    const req = new NextRequest("http://localhost/api/medications/med-1", {
      method: "DELETE",
    });
    const res = await deleteMedication(req, ctx("med-1"));
    expect(res.status).toBe(204);
  });
});
