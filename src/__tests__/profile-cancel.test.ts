import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ── hoisted mocks ───────────────────────────────────────────────────────────
const { authMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: authMock,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
  isDatabaseConfigured: vi.fn(() => true),
}));

import { GET, PUT } from '@/app/api/users/me/route';
import { POST as cancelBooking } from '@/app/api/bookings/[id]/cancel/route';
import { isDatabaseConfigured } from '@/lib/prisma';

const isDatabaseConfiguredMock = isDatabaseConfigured as ReturnType<typeof vi.fn>;

const userSession = { user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' } };

function makePutRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeCancelRequest(bookingId: string) {
  return new NextRequest(`http://localhost/api/bookings/${bookingId}/cancel`, {
    method: 'POST',
  });
}

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

// ── GET /api/users/me ────────────────────────────────────────────────────────
describe('GET /api/users/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns user: null when DB not configured', async () => {
    authMock.mockResolvedValue(userSession);
    isDatabaseConfiguredMock.mockReturnValueOnce(false);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeNull();
  });

  it('returns user profile when authenticated', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      phone: '555-1234',
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.name).toBe('Alice');
  });
});

// ── PUT /api/users/me ────────────────────────────────────────────────────────
describe('PUT /api/users/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const req = makePutRequest({ name: 'Bob' });
    const res = await PUT(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when name is too long', async () => {
    authMock.mockResolvedValue(userSession);
    const req = makePutRequest({ name: 'A'.repeat(101) });
    const res = await PUT(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid request');
  });

  it('returns 200 and updated user on success', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.user.update.mockResolvedValue({
      id: 'user-1',
      name: 'Bob',
      email: 'alice@example.com',
      phone: '555-9999',
    });
    const req = makePutRequest({ name: 'Bob', phone: '555-9999' });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.name).toBe('Bob');
    expect(data.user.phone).toBe('555-9999');
  });
});

// ── POST /api/bookings/[id]/cancel ───────────────────────────────────────────
describe('POST /api/bookings/[id]/cancel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const req = makeCancelRequest('book-1');
    const res = await cancelBooking(req, makeParams('book-1'));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when booking not found', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.booking.findUnique.mockResolvedValue(null);
    const req = makeCancelRequest('book-x');
    const res = await cancelBooking(req, makeParams('book-x'));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Booking not found');
  });

  it('returns 403 when booking belongs to another user', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'book-1',
      userId: 'other-user',
      status: 'pending',
    });
    const req = makeCancelRequest('book-1');
    const res = await cancelBooking(req, makeParams('book-1'));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Forbidden');
  });

  it('returns 409 when booking is checked_in', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'book-1',
      userId: 'user-1',
      status: 'checked_in',
    });
    const req = makeCancelRequest('book-1');
    const res = await cancelBooking(req, makeParams('book-1'));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain('checked_in');
  });

  it('returns 409 when booking is already cancelled', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'book-1',
      userId: 'user-1',
      status: 'cancelled',
    });
    const req = makeCancelRequest('book-1');
    const res = await cancelBooking(req, makeParams('book-1'));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain('cancelled');
  });

  it('returns 200 and cancelled booking on success', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'book-1',
      userId: 'user-1',
      status: 'confirmed',
    });
    prismaMock.booking.update.mockResolvedValue({
      id: 'book-1',
      userId: 'user-1',
      status: 'cancelled',
    });
    const req = makeCancelRequest('book-1');
    const res = await cancelBooking(req, makeParams('book-1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.booking.status).toBe('cancelled');
  });
});
