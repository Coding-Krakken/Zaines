import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ── hoisted mocks ────────────────────────────────────────────────────────────
const { authMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    pet: {
      findUnique: vi.fn(),
    },
    vaccine: {
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

import {
  GET as getVaccines,
  POST as postVaccine,
} from "@/app/api/vaccines/route";
import {
  GET as getVaccine,
  PUT as putVaccine,
  DELETE as deleteVaccine,
} from "@/app/api/vaccines/[id]/route";

const userSession = { user: { id: "user-1" } };

const userPet = { id: "pet-1", userId: "user-1", name: "Buddy" };
const otherPet = { id: "pet-2", userId: "user-2", name: "Max" };

const validVaccineBody = {
  name: "Rabies",
  administeredDate: "2024-01-01T00:00:00Z",
  expiryDate: "2027-01-01T00:00:00Z",
  veterinarian: "Dr. Smith",
  documentUrl: "https://example.com/doc.pdf",
  notes: "Annual vaccine",
};

const storedVaccine = {
  id: "vaccine-1",
  petId: "pet-1",
  ...validVaccineBody,
  administeredDate: new Date("2024-01-01"),
  expiryDate: new Date("2027-01-01"),
  pet: { id: "pet-1", name: "Buddy", userId: "user-1" },
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeGetRequest(url = "http://localhost/api/vaccines") {
  return new NextRequest(url, { method: "GET" });
}

function makePostRequest(
  body: Record<string, unknown>,
  url = "http://localhost/api/vaccines",
) {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makePutRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/vaccines/vaccine-1", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeDeleteRequest() {
  return new NextRequest("http://localhost/api/vaccines/vaccine-1", {
    method: "DELETE",
  });
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ── GET /api/vaccines ─────────────────────────────────────────────────────────
describe("GET /api/vaccines", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await getVaccines(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it("returns vaccines for user", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.vaccine.findMany.mockResolvedValue([storedVaccine]);
    const res = await getVaccines(makeGetRequest());
    expect(res.status).toBe(200);
    const data = (await res.json()) as { vaccines: (typeof storedVaccine)[] };
    expect(data.vaccines).toHaveLength(1);
  });

  it("filters vaccines by petId", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.vaccine.findMany.mockResolvedValue([storedVaccine]);
    const res = await getVaccines(
      makeGetRequest("http://localhost/api/vaccines?petId=pet-1"),
    );
    expect(res.status).toBe(200);
    expect(prismaMock.vaccine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pet: { id: "pet-1", userId: "user-1" } },
      }),
    );
  });
});

// ── POST /api/vaccines ────────────────────────────────────────────────────────
describe("POST /api/vaccines", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await postVaccine(
      makePostRequest({ petId: "pet-1", ...validVaccineBody }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when petId is missing", async () => {
    authMock.mockResolvedValue(userSession);
    const res = await postVaccine(makePostRequest(validVaccineBody));
    expect(res.status).toBe(400);
  });

  it("returns 404 when pet not found", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findUnique.mockResolvedValue(null);
    const res = await postVaccine(
      makePostRequest({ petId: "pet-1", ...validVaccineBody }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when pet belongs to another user", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findUnique.mockResolvedValue(otherPet);
    const res = await postVaccine(
      makePostRequest({ petId: "pet-2", ...validVaccineBody }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when validation fails", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findUnique.mockResolvedValue(userPet);
    const invalidData = { petId: "pet-1", name: "" }; // Missing required fields
    const res = await postVaccine(makePostRequest(invalidData));
    expect(res.status).toBe(400);
  });

  it("creates vaccine successfully", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findUnique.mockResolvedValue(userPet);
    prismaMock.vaccine.create.mockResolvedValue(storedVaccine);
    const res = await postVaccine(
      makePostRequest({ petId: "pet-1", ...validVaccineBody }),
    );
    expect(res.status).toBe(201);
    const data = (await res.json()) as { vaccine: typeof storedVaccine };
    expect(data.vaccine.name).toBe("Rabies");
  });
});

// ── GET /api/vaccines/[id] ────────────────────────────────────────────────────
describe("GET /api/vaccines/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await getVaccine(makeGetRequest(), ctx("vaccine-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when vaccine not found", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.vaccine.findUnique.mockResolvedValue(null);
    const res = await getVaccine(makeGetRequest(), ctx("vaccine-1"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when vaccine belongs to another user", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.vaccine.findUnique.mockResolvedValue({
      ...storedVaccine,
      pet: { ...storedVaccine.pet, userId: "user-2" },
    });
    const res = await getVaccine(makeGetRequest(), ctx("vaccine-1"));
    expect(res.status).toBe(403);
  });

  it("returns vaccine successfully", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.vaccine.findUnique.mockResolvedValue(storedVaccine);
    const res = await getVaccine(makeGetRequest(), ctx("vaccine-1"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { vaccine: typeof storedVaccine };
    expect(data.vaccine.id).toBe("vaccine-1");
  });
});

// ── PUT /api/vaccines/[id] ────────────────────────────────────────────────────
describe("PUT /api/vaccines/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await putVaccine(
      makePutRequest(validVaccineBody),
      ctx("vaccine-1"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when vaccine not found", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.vaccine.findUnique.mockResolvedValue(null);
    const res = await putVaccine(
      makePutRequest(validVaccineBody),
      ctx("vaccine-1"),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when vaccine belongs to another user", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.vaccine.findUnique.mockResolvedValue({
      ...storedVaccine,
      pet: { userId: "user-2" },
    });
    const res = await putVaccine(
      makePutRequest(validVaccineBody),
      ctx("vaccine-1"),
    );
    expect(res.status).toBe(403);
  });

  it("updates vaccine successfully", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.vaccine.findUnique.mockResolvedValue({
      ...storedVaccine,
      pet: { userId: "user-1" },
    });
    prismaMock.vaccine.update.mockResolvedValue(storedVaccine);
    const res = await putVaccine(
      makePutRequest(validVaccineBody),
      ctx("vaccine-1"),
    );
    expect(res.status).toBe(200);
  });
});

// ── DELETE /api/vaccines/[id] ─────────────────────────────────────────────────
describe("DELETE /api/vaccines/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValue(null);
    const res = await deleteVaccine(makeDeleteRequest(), ctx("vaccine-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when vaccine not found", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.vaccine.findUnique.mockResolvedValue(null);
    const res = await deleteVaccine(makeDeleteRequest(), ctx("vaccine-1"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when vaccine belongs to another user", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.vaccine.findUnique.mockResolvedValue({
      ...storedVaccine,
      pet: { userId: "user-2" },
    });
    const res = await deleteVaccine(makeDeleteRequest(), ctx("vaccine-1"));
    expect(res.status).toBe(403);
  });

  it("deletes vaccine successfully", async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.vaccine.findUnique.mockResolvedValue({
      ...storedVaccine,
      pet: { userId: "user-1" },
    });
    prismaMock.vaccine.delete.mockResolvedValue(storedVaccine);
    const res = await deleteVaccine(makeDeleteRequest(), ctx("vaccine-1"));
    expect(res.status).toBe(204);
  });
});
