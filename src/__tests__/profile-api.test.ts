import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ── hoisted mocks ────────────────────────────────────────────────────────────
const { authMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
  isDatabaseConfigured: vi.fn(() => true),
}));

import { GET as getProfile, PUT as putProfile } from '@/app/api/profile/route';
import { isDatabaseConfigured } from '@/lib/prisma';

const isDatabaseConfiguredMock = isDatabaseConfigured as ReturnType<typeof vi.fn>;

const userSession = { user: { id: 'user-1', email: 'user@example.com' } };
const otherSession = { user: { id: 'user-2', email: 'other@example.com' } };

const storedUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'user@example.com',
  phone: '555-1234',
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zip: '10001',
};

const validProfileUpdate = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '555-5678',
  address: '456 Oak Ave',
  city: 'Brooklyn',
  state: 'NY',
  zip: '11201',
};

function makeGetRequest(url = 'http://localhost/api/profile') {
  return new NextRequest(url, { method: 'GET' });
}

function makePutRequest(body: Record<string, unknown>, url = 'http://localhost/api/profile') {
  return new NextRequest(url, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── GET /api/profile ──────────────────────────────────────────────────────────
describe('GET /api/profile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const res = await getProfile();
    expect(res.status).toBe(401);
    const data = await res.json() as { error: string };
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 503 when database not configured', async () => {
    authMock.mockResolvedValue(userSession);
    isDatabaseConfiguredMock.mockReturnValueOnce(false);
    const res = await getProfile();
    expect(res.status).toBe(503);
  });

  it('returns 404 when user not found', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = await getProfile();
    expect(res.status).toBe(404);
  });

  it('returns user profile when authenticated', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.user.findUnique.mockResolvedValue(storedUser);
    const res = await getProfile();
    expect(res.status).toBe(200);
    const data = await res.json() as { user: typeof storedUser };
    expect(data.user.email).toBe('user@example.com');
    expect(data.user.name).toBe('John Doe');
  });
});

// ── PUT /api/profile ──────────────────────────────────────────────────────────
describe('PUT /api/profile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const res = await putProfile(makePutRequest(validProfileUpdate));
    expect(res.status).toBe(401);
  });

  it('returns 503 when database not configured', async () => {
    authMock.mockResolvedValue(userSession);
    isDatabaseConfiguredMock.mockReturnValueOnce(false);
    const res = await putProfile(makePutRequest(validProfileUpdate));
    expect(res.status).toBe(503);
  });

  it('returns 400 when validation fails', async () => {
    authMock.mockResolvedValue(userSession);
    const invalidData = { ...validProfileUpdate, email: 'invalid-email' };
    const res = await putProfile(makePutRequest(invalidData));
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toBe('Invalid request');
  });

  it('returns 409 when email is already in use', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'user-2', email: 'jane@example.com' });
    const res = await putProfile(makePutRequest(validProfileUpdate));
    expect(res.status).toBe(409);
    const data = await res.json() as { error: string };
    expect(data.error).toBe('Email already in use');
  });

  it('updates profile successfully', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(null); // Email not in use
    prismaMock.user.update.mockResolvedValue({ ...storedUser, ...validProfileUpdate });
    const res = await putProfile(makePutRequest(validProfileUpdate));
    expect(res.status).toBe(200);
    const data = await res.json() as { user: typeof storedUser };
    expect(data.user.name).toBe('Jane Doe');
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: validProfileUpdate,
      select: expect.any(Object),
    });
  });

  it('allows keeping the same email', async () => {
    authMock.mockResolvedValue(userSession);
    const sameEmailUpdate = { ...validProfileUpdate, email: 'user@example.com' };
    prismaMock.user.update.mockResolvedValue({ ...storedUser, ...sameEmailUpdate });
    const res = await putProfile(makePutRequest(sameEmailUpdate));
    expect(res.status).toBe(200);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled(); // No email check
  });
});
