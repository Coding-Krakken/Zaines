import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ── hoisted mocks ────────────────────────────────────────────────────────────
const { authMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    vaccine: {
      findMany: vi.fn(),
    },
    medication: {
      findMany: vi.fn(),
    },
    weightLog: {
      findMany: vi.fn(),
    },
    activity: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
  isDatabaseConfigured: vi.fn(() => true),
}));

import { GET as getHealthTimeline } from '@/app/api/health-timeline/route';
import { isDatabaseConfigured } from '@/lib/prisma';

const isDatabaseConfiguredMock = isDatabaseConfigured as ReturnType<typeof vi.fn>;

const userSession = { user: { id: 'user-1' } };

const mockVaccine = {
  id: 'vaccine-1',
  petId: 'pet-1',
  name: 'Rabies',
  administeredDate: new Date('2024-01-01'),
  expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
  veterinarian: 'Dr. Smith',
  documentUrl: null,
  notes: null,
  pet: { id: 'pet-1', name: 'Buddy' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockExpiredVaccine = {
  ...mockVaccine,
  id: 'vaccine-2',
  name: 'DHPP',
  expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
};

const mockMedication = {
  id: 'med-1',
  petId: 'pet-1',
  name: 'Carprofen',
  dosage: '75mg',
  frequency: 'Twice daily',
  startDate: new Date('2024-01-01'),
  endDate: null,
  instructions: null,
  prescribedBy: 'Dr. Smith',
  pet: { id: 'pet-1', name: 'Buddy' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWeightLog = {
  id: 'weight-1',
  petId: 'pet-1',
  weight: 65.5,
  date: new Date('2024-01-15'),
  notes: 'Healthy weight',
  pet: { id: 'pet-1', name: 'Buddy' },
};

const mockActivity = {
  id: 'activity-1',
  petId: 'pet-1',
  activityType: 'Walk',
  timestamp: new Date('2024-01-20'),
  notes: '30 minute walk',
  duration: 30,
  bookingId: null,
  pet: { id: 'pet-1', name: 'Buddy' },
};

function makeGetRequest(url = 'http://localhost/api/health-timeline') {
  return new NextRequest(url, { method: 'GET' });
}

// ── GET /api/health-timeline ──────────────────────────────────────────────────
describe('GET /api/health-timeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.vaccine.findMany.mockResolvedValue([]);
    prismaMock.medication.findMany.mockResolvedValue([]);
    prismaMock.weightLog.findMany.mockResolvedValue([]);
    prismaMock.activity.findMany.mockResolvedValue([]);
  });

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const res = await getHealthTimeline(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns 503 when database not configured', async () => {
    authMock.mockResolvedValue(userSession);
    isDatabaseConfiguredMock.mockReturnValueOnce(false);
    const res = await getHealthTimeline(makeGetRequest());
    expect(res.status).toBe(503);
  });

  it('returns empty timeline when no data', async () => {
    authMock.mockResolvedValue(userSession);
    const res = await getHealthTimeline(makeGetRequest());
    expect(res.status).toBe(200);
    const data = await res.json() as { timeline: unknown[]; alerts: { critical: number; warning: number; info: number } };
    expect(data.timeline).toEqual([]);
    expect(data.alerts).toEqual({ critical: 0, warning: 0, info: 0 });
  });

  it('includes vaccines with critical alert for expiring soon', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.vaccine.findMany.mockResolvedValue([mockVaccine]);
    const res = await getHealthTimeline(makeGetRequest());
    expect(res.status).toBe(200);
    const data = await res.json() as {
      timeline: Array<{ type: string; alert?: string; title: string }>;
      alerts: { critical: number; warning: number; info: number };
    };
    expect(data.timeline).toHaveLength(1);
    expect(data.timeline[0].type).toBe('vaccine');
    expect(data.timeline[0].alert).toBe('critical');
    expect(data.alerts.critical).toBe(1);
  });

  it('marks expired vaccines as critical', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.vaccine.findMany.mockResolvedValue([mockExpiredVaccine]);
    const res = await getHealthTimeline(makeGetRequest());
    expect(res.status).toBe(200);
    const data = await res.json() as {
      timeline: Array<{ type: string; alert?: string; title: string }>;
      alerts: { critical: number };
    };
    expect(data.timeline[0].alert).toBe('critical');
    expect(data.timeline[0].title).toContain('Expired');
    expect(data.alerts.critical).toBe(1);
  });

  it('includes medications, weight logs, and activities', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.medication.findMany.mockResolvedValue([mockMedication]);
    prismaMock.weightLog.findMany.mockResolvedValue([mockWeightLog]);
    prismaMock.activity.findMany.mockResolvedValue([mockActivity]);
    const res = await getHealthTimeline(makeGetRequest());
    expect(res.status).toBe(200);
    const data = await res.json() as { timeline: Array<{ type: string }>; total: number };
    expect(data.timeline).toHaveLength(3);
    const types = data.timeline.map((item) => item.type);
    expect(types).toContain('medication');
    expect(types).toContain('weight');
    expect(types).toContain('activity');
  });

  it('filters timeline by petId when provided', async () => {
    authMock.mockResolvedValue(userSession);
    prismaMock.vaccine.findMany.mockResolvedValue([mockVaccine]);
    const res = await getHealthTimeline(
      makeGetRequest('http://localhost/api/health-timeline?petId=pet-1'),
    );
    expect(res.status).toBe(200);
    expect(prismaMock.vaccine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pet: { id: 'pet-1', userId: 'user-1' } },
      }),
    );
  });
});
