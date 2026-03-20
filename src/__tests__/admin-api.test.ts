import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ── hoisted mocks ───────────────────────────────────────────────────────────
const { authMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    booking: {
      findMany: vi.fn(),
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

import { GET as getBookings } from '@/app/api/admin/bookings/route';
import { POST as postCheckIn } from '@/app/api/admin/check-in/route';
import { POST as postCheckOut } from '@/app/api/admin/check-out/route';
import { isDatabaseConfigured } from '@/lib/prisma';

const isDatabaseConfiguredMock = isDatabaseConfigured as ReturnType<typeof vi.fn>;

function makeRequest(body?: Record<string, unknown>, url = 'http://localhost/api/admin/check-in') {
  return new NextRequest(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : {},
  });
}

const staffSession = { user: { id: 'user-1', role: 'staff' } };
const adminSession = { user: { id: 'user-2', role: 'admin' } };
const customerSession = { user: { id: 'user-3', role: 'customer' } };

describe('GET /api/admin/bookings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const res = await getBookings();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 403 for customer role', async () => {
    authMock.mockResolvedValue(customerSession);
    const res = await getBookings();
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Forbidden');
  });

  it('returns empty bookings when DB not configured', async () => {
    authMock.mockResolvedValue(staffSession);
    isDatabaseConfiguredMock.mockReturnValueOnce(false);
    const res = await getBookings();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.bookings).toEqual([]);
  });

  it('returns bookings for staff role', async () => {
    authMock.mockResolvedValue(staffSession);
    const mockBookings = [
      {
        id: 'book-1',
        bookingNumber: 'PB-001',
        status: 'confirmed',
        checkInDate: new Date(),
        checkOutDate: new Date(),
        user: { name: 'Alice', email: 'alice@example.com' },
        suite: { name: 'Suite 101' },
        bookingPets: [{ pet: { name: 'Rex', breed: 'Lab' } }],
      },
    ];
    prismaMock.booking.findMany.mockResolvedValue(mockBookings);
    const res = await getBookings();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.bookings).toHaveLength(1);
  });

  it('returns bookings for admin role', async () => {
    authMock.mockResolvedValue(adminSession);
    prismaMock.booking.findMany.mockResolvedValue([]);
    const res = await getBookings();
    expect(res.status).toBe(200);
  });
});

describe('POST /api/admin/check-in', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const res = await postCheckIn(makeRequest({ bookingId: 'book-1' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 for customer role', async () => {
    authMock.mockResolvedValue(customerSession);
    const res = await postCheckIn(makeRequest({ bookingId: 'book-1' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when bookingId is missing', async () => {
    authMock.mockResolvedValue(staffSession);
    const res = await postCheckIn(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('bookingId is required');
  });

  it('returns 503 when DB not configured', async () => {
    authMock.mockResolvedValue(staffSession);
    isDatabaseConfiguredMock.mockReturnValueOnce(false);
    const res = await postCheckIn(makeRequest({ bookingId: 'book-1' }));
    expect(res.status).toBe(503);
  });

  it('returns 404 when booking not found', async () => {
    authMock.mockResolvedValue(staffSession);
    prismaMock.booking.findUnique.mockResolvedValue(null);
    const res = await postCheckIn(makeRequest({ bookingId: 'book-1' }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Booking not found');
  });

  it('returns 409 when booking is not confirmed', async () => {
    authMock.mockResolvedValue(staffSession);
    prismaMock.booking.findUnique.mockResolvedValue({ id: 'book-1', status: 'checked_in' });
    const res = await postCheckIn(makeRequest({ bookingId: 'book-1' }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain('checked_in');
  });

  it('returns 200 and updates booking on success', async () => {
    authMock.mockResolvedValue(staffSession);
    prismaMock.booking.findUnique.mockResolvedValue({ id: 'book-1', status: 'confirmed' });
    prismaMock.booking.update.mockResolvedValue({ id: 'book-1', status: 'checked_in' });
    const res = await postCheckIn(makeRequest({ bookingId: 'book-1' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.booking.status).toBe('checked_in');
    expect(prismaMock.booking.update).toHaveBeenCalledWith({
      where: { id: 'book-1' },
      data: { status: 'checked_in' },
    });
  });
});

describe('POST /api/admin/check-out', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const res = await postCheckOut(makeRequest({ bookingId: 'book-1' }, 'http://localhost/api/admin/check-out'));
    expect(res.status).toBe(401);
  });

  it('returns 403 for customer role', async () => {
    authMock.mockResolvedValue(customerSession);
    const res = await postCheckOut(makeRequest({ bookingId: 'book-1' }, 'http://localhost/api/admin/check-out'));
    expect(res.status).toBe(403);
  });

  it('returns 400 when bookingId is missing', async () => {
    authMock.mockResolvedValue(staffSession);
    const res = await postCheckOut(makeRequest({}, 'http://localhost/api/admin/check-out'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when booking not found', async () => {
    authMock.mockResolvedValue(staffSession);
    prismaMock.booking.findUnique.mockResolvedValue(null);
    const res = await postCheckOut(makeRequest({ bookingId: 'book-1' }, 'http://localhost/api/admin/check-out'));
    expect(res.status).toBe(404);
  });

  it('returns 409 when booking is not checked_in', async () => {
    authMock.mockResolvedValue(staffSession);
    prismaMock.booking.findUnique.mockResolvedValue({ id: 'book-1', status: 'confirmed' });
    const res = await postCheckOut(makeRequest({ bookingId: 'book-1' }, 'http://localhost/api/admin/check-out'));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain('confirmed');
  });

  it('returns 200 and updates booking to completed on success', async () => {
    authMock.mockResolvedValue(staffSession);
    prismaMock.booking.findUnique.mockResolvedValue({ id: 'book-1', status: 'checked_in' });
    prismaMock.booking.update.mockResolvedValue({ id: 'book-1', status: 'completed' });
    const res = await postCheckOut(makeRequest({ bookingId: 'book-1' }, 'http://localhost/api/admin/check-out'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.booking.status).toBe('completed');
    expect(prismaMock.booking.update).toHaveBeenCalledWith({
      where: { id: 'book-1' },
      data: { status: 'completed' },
    });
  });
});
