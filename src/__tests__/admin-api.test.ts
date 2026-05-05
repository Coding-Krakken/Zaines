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
    activity: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    petPhoto: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    suite: {
      findMany: vi.fn(),
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
import { GET as getActivities, POST as postActivities } from '@/app/api/admin/activities/route';
import { GET as getPhotos, POST as postPhotos } from '@/app/api/admin/photos/route';
import { GET as getOccupancy } from '@/app/api/admin/occupancy/route';
import { GET as getContacts } from '@/app/api/admin/contacts/route';
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

describe('POST /api/admin/activities', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 for customer role', async () => {
    authMock.mockResolvedValue(customerSession);
    const req = makeRequest({ bookingId: 'book-1', petId: 'pet-1', type: 'walk' }, 'http://localhost/api/admin/activities');
    const res = await postActivities(req);
    expect(res.status).toBe(403);
  });

  it('returns 409 when booking is not checked_in', async () => {
    authMock.mockResolvedValue(staffSession);
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'book-1',
      status: 'confirmed',
      bookingPets: [{ petId: 'pet-1' }],
    });

    const req = makeRequest({ bookingId: 'book-1', petId: 'pet-1', type: 'walk' }, 'http://localhost/api/admin/activities');
    const res = await postActivities(req);
    expect(res.status).toBe(409);
  });

  it('returns 201 and creates activity on success', async () => {
    authMock.mockResolvedValue(staffSession);
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'book-1',
      status: 'checked_in',
      bookingPets: [{ petId: 'pet-1' }],
    });
    prismaMock.activity.create.mockResolvedValue({
      id: 'act-1',
      type: 'walk',
      booking: { id: 'book-1', bookingNumber: 'PB-001', status: 'checked_in' },
      pet: { id: 'pet-1', name: 'Rex', breed: 'Lab' },
    });

    const req = makeRequest({ bookingId: 'book-1', petId: 'pet-1', type: 'walk' }, 'http://localhost/api/admin/activities');
    const res = await postActivities(req);
    expect(res.status).toBe(201);
    expect(prismaMock.activity.create).toHaveBeenCalled();
  });
});

describe('GET /api/admin/activities', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const res = await getActivities(new NextRequest('http://localhost/api/admin/activities'));
    expect(res.status).toBe(401);
  });

  it('returns activities for staff role', async () => {
    authMock.mockResolvedValue(staffSession);
    prismaMock.activity.findMany.mockResolvedValue([{ id: 'act-1', type: 'walk' }]);
    const res = await getActivities(new NextRequest('http://localhost/api/admin/activities?limit=5'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.activities).toHaveLength(1);
  });
});

describe('GET /api/admin/photos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 for customer role', async () => {
    authMock.mockResolvedValue(customerSession);
    const res = await getPhotos(new NextRequest('http://localhost/api/admin/photos'));
    expect(res.status).toBe(403);
  });
});

describe('POST /api/admin/photos', () => {
  beforeEach(() => vi.clearAllMocks());

  function makePhotoRequest(fields: Record<string, string>) {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) {
      form.append(k, v);
    }
    // Attach a minimal valid file so the route passes file validation
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    form.append('file', file);
    return new NextRequest('http://localhost/api/admin/photos', { method: 'POST', body: form });
  }

  it('returns 409 when booking is not checked_in', async () => {
    authMock.mockResolvedValue(staffSession);
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'book-1',
      status: 'confirmed',
      bookingPets: [{ petId: 'pet-1' }],
    });
    const res = await postPhotos(makePhotoRequest({ bookingId: 'book-1', petId: 'pet-1' }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/confirmed/);
  });

  it('returns 409 when pet is not assigned to the booking', async () => {
    authMock.mockResolvedValue(staffSession);
    prismaMock.booking.findUnique.mockResolvedValue({
      id: 'book-1',
      status: 'checked_in',
      bookingPets: [{ petId: 'pet-other' }],
    });
    const res = await postPhotos(makePhotoRequest({ bookingId: 'book-1', petId: 'pet-1' }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/not assigned/);
  });
});

describe('GET /api/admin/occupancy', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns normalized occupancy summary', async () => {
    authMock.mockResolvedValue(adminSession);
    prismaMock.suite.findMany.mockResolvedValue([
      {
        id: 'suite-1',
        name: 'Suite A',
        tier: 'Standard',
        size: 'Medium',
        capacity: 2,
        bookings: [
          {
            id: 'book-1',
            bookingNumber: 'PB-001',
            checkInDate: new Date(),
            checkOutDate: new Date(),
            user: { id: 'u1', name: 'Alice', email: 'alice@example.com' },
            bookingPets: [{ pet: { id: 'pet-1', name: 'Rex', breed: 'Lab' } }],
          },
        ],
      },
    ]);

    const res = await getOccupancy();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.summary.occupiedPets).toBe(1);
    expect(data.suites[0].occupancyPct).toBe(50);
  });
});

describe('GET /api/admin/contacts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when booking filter does not exist', async () => {
    authMock.mockResolvedValue(staffSession);
    prismaMock.booking.findUnique.mockResolvedValue(null);
    const res = await getContacts(new NextRequest('http://localhost/api/admin/contacts?bookingId=missing'));
    expect(res.status).toBe(404);
  });

  it('returns contacts for checked-in bookings', async () => {
    authMock.mockResolvedValue(staffSession);
    prismaMock.booking.findMany.mockResolvedValue([
      {
        id: 'book-1',
        bookingNumber: 'PB-001',
        checkInDate: new Date(),
        user: {
          id: 'u1',
          name: 'Alice',
          email: 'alice@example.com',
          emergencyContacts: [
            {
              id: 'ec-1',
              name: 'Bob',
              relationship: 'Brother',
              phone: '555-0100',
              email: 'bob@example.com',
              isPrimary: true,
              createdAt: new Date(),
            },
          ],
        },
        bookingPets: [{ pet: { id: 'pet-1', name: 'Rex', breed: 'Lab' } }],
      },
    ]);

    const res = await getContacts(new NextRequest('http://localhost/api/admin/contacts'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.contacts).toHaveLength(1);
    expect(data.contacts[0].guest.name).toBe('Alice');
  });
});
