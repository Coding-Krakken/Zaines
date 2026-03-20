import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ── hoisted mocks ────────────────────────────────────────────────────────────
const { authMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    pet: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
  isDatabaseConfigured: vi.fn(() => true),
}));

import { GET as getPets, POST as postPet } from '@/app/api/pets/route';
import {
  GET as getPet,
  PUT as putPet,
  DELETE as deletePet,
} from '@/app/api/pets/[id]/route';
import { isDatabaseConfigured } from '@/lib/prisma';

const isDatabaseConfiguredMock = isDatabaseConfigured as ReturnType<typeof vi.fn>;

const userSession = { user: { id: 'user-1' } };
const otherSession = { user: { id: 'user-2' } };

const validPetBody = {
  name: 'Buddy',
  breed: 'Labrador',
  age: 3,
  weight: 60.5,
  gender: 'male',
  spayedNeutered: false,
};

const storedPet = {
  id: 'pet-1',
  userId: 'user-1',
  ...validPetBody,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeGetRequest(url = 'http://localhost/api/pets') {
  return new NextRequest(url, { method: 'GET' });
}

function makePostRequest(body: Record<string, unknown>, url = 'http://localhost/api/pets') {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makePutRequest(body: Record<string, unknown>, id = 'pet-1') {
  return new NextRequest(`http://localhost/api/pets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeDeleteRequest(id = 'pet-1') {
  return new NextRequest(`http://localhost/api/pets/${id}`, { method: 'DELETE' });
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ── GET /api/pets ─────────────────────────────────────────────────────────────
describe('GET /api/pets', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const res = await getPets();
    expect(res.status).toBe(401);
    const data = await res.json() as { error: string };
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 503 when database not configured', async () => {
    authMock.mockResolvedValue(userSession);
    isDatabaseConfiguredMock.mockReturnValueOnce(false);
    const res = await getPets();
    expect(res.status).toBe(503);
  });

  it('returns 200 with pets list', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findMany.mockResolvedValue([storedPet]);
    const res = await getPets();
    expect(res.status).toBe(200);
    const data = await res.json() as { pets: typeof storedPet[] };
    expect(data.pets).toHaveLength(1);
    expect(data.pets[0].name).toBe('Buddy');
  });
});

// ── POST /api/pets ────────────────────────────────────────────────────────────
describe('POST /api/pets', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const res = await postPet(makePostRequest(validPetBody));
    expect(res.status).toBe(401);
    const data = await res.json() as { error: string };
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid body', async () => {
    authMock.mockResolvedValue(userSession);
    const res = await postPet(makePostRequest({ name: '' }));
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toBe('Invalid request');
  });

  it('returns 201 with created pet', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.create.mockResolvedValue(storedPet);
    const res = await postPet(makePostRequest(validPetBody));
    expect(res.status).toBe(201);
    const data = await res.json() as { pet: typeof storedPet };
    expect(data.pet.id).toBe('pet-1');
    expect(prismaMock.pet.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Buddy', userId: 'user-1' }),
    });
  });
});

// ── GET /api/pets/[id] ────────────────────────────────────────────────────────
describe('GET /api/pets/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const res = await getPet(makeGetRequest(), ctx('pet-1'));
    expect(res.status).toBe(401);
  });

  it('returns 404 when pet not found', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findUnique.mockResolvedValue(null);
    const res = await getPet(makeGetRequest(), ctx('pet-1'));
    expect(res.status).toBe(404);
  });

  it('returns 403 for wrong user', async () => {
    authMock.mockResolvedValue(otherSession);
    prismaMock.pet.findUnique.mockResolvedValue(storedPet);
    const res = await getPet(makeGetRequest(), ctx('pet-1'));
    expect(res.status).toBe(403);
  });

  it('returns 200 with pet', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findUnique.mockResolvedValue(storedPet);
    const res = await getPet(makeGetRequest(), ctx('pet-1'));
    expect(res.status).toBe(200);
    const data = await res.json() as { pet: typeof storedPet };
    expect(data.pet.id).toBe('pet-1');
  });
});

// ── PUT /api/pets/[id] ────────────────────────────────────────────────────────
describe('PUT /api/pets/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const res = await putPet(makePutRequest(validPetBody), ctx('pet-1'));
    expect(res.status).toBe(401);
  });

  it('returns 403 for wrong user', async () => {
    authMock.mockResolvedValue(otherSession);
    prismaMock.pet.findUnique.mockResolvedValue(storedPet);
    const res = await putPet(makePutRequest(validPetBody), ctx('pet-1'));
    expect(res.status).toBe(403);
  });

  it('returns 404 when pet not found', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findUnique.mockResolvedValue(null);
    const res = await putPet(makePutRequest(validPetBody), ctx('pet-1'));
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid body', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findUnique.mockResolvedValue(storedPet);
    const res = await putPet(makePutRequest({ name: '' }), ctx('pet-1'));
    expect(res.status).toBe(400);
  });

  it('returns 200 with updated pet', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findUnique.mockResolvedValue(storedPet);
    const updated = { ...storedPet, name: 'Max' };
    prismaMock.pet.update.mockResolvedValue(updated);
    const res = await putPet(makePutRequest({ ...validPetBody, name: 'Max' }), ctx('pet-1'));
    expect(res.status).toBe(200);
    const data = await res.json() as { pet: typeof updated };
    expect(data.pet.name).toBe('Max');
  });
});

// ── DELETE /api/pets/[id] ─────────────────────────────────────────────────────
describe('DELETE /api/pets/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const res = await deletePet(makeDeleteRequest(), ctx('pet-1'));
    expect(res.status).toBe(401);
  });

  it('returns 403 for wrong user', async () => {
    authMock.mockResolvedValue(otherSession);
    prismaMock.pet.findUnique.mockResolvedValue(storedPet);
    const res = await deletePet(makeDeleteRequest(), ctx('pet-1'));
    expect(res.status).toBe(403);
  });

  it('returns 404 when pet not found', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findUnique.mockResolvedValue(null);
    const res = await deletePet(makeDeleteRequest(), ctx('pet-1'));
    expect(res.status).toBe(404);
  });

  it('returns 204 on success', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.pet.findUnique.mockResolvedValue(storedPet);
    prismaMock.pet.delete.mockResolvedValue(storedPet);
    const res = await deletePet(makeDeleteRequest(), ctx('pet-1'));
    expect(res.status).toBe(204);
  });
});
