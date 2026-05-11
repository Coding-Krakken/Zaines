import { beforeEach, describe, expect, it, vi } from 'vitest';

const { isDatabaseConfiguredMock, prismaMock } = vi.hoisted(() => ({
  isDatabaseConfiguredMock: vi.fn(() => true),
  prismaMock: {
    payment: {
      findMany: vi.fn<() => Promise<Array<Record<string, unknown>>>>(async () => []),
    },
    message: {
      findMany: vi.fn<() => Promise<Array<Record<string, unknown>>>>(async () => []),
    },
    stripeEvent: {
      findMany: vi.fn<() => Promise<Array<Record<string, unknown>>>>(async () => []),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  isDatabaseConfigured: isDatabaseConfiguredMock,
  prisma: prismaMock,
}));

import { getFinanceAlerts } from '@/lib/api/admin-finance';

function buildStripeEvent(id: string, createdAt: Date, processedAt: Date | null) {
  return {
    eventId: id,
    eventType: 'payment_intent.succeeded',
    processed: processedAt !== null,
    createdAt,
    processedAt,
  };
}

describe('getFinanceAlerts webhook thresholds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isDatabaseConfiguredMock.mockReturnValue(true);
  });

  it('emits critical alerts for webhook backlog and high processing lag', async () => {
    const now = new Date('2026-05-11T12:00:00.000Z');

    prismaMock.payment.findMany.mockResolvedValueOnce([]);
    prismaMock.payment.findMany.mockResolvedValueOnce([]);
    prismaMock.message.findMany.mockResolvedValueOnce([]);

    prismaMock.stripeEvent.findMany.mockResolvedValueOnce([
      buildStripeEvent('evt-1', new Date('2026-05-11T11:40:00.000Z'), new Date('2026-05-11T11:45:20.000Z')),
      buildStripeEvent('evt-2', new Date('2026-05-11T11:00:00.000Z'), new Date('2026-05-11T11:05:40.000Z')),
      buildStripeEvent('evt-3', new Date('2026-05-11T11:30:00.000Z'), null),
      buildStripeEvent('evt-4', new Date('2026-05-11T11:20:00.000Z'), null),
      buildStripeEvent('evt-5', new Date('2026-05-11T11:10:00.000Z'), null),
      buildStripeEvent('evt-6', new Date('2026-05-11T11:00:00.000Z'), null),
      buildStripeEvent('evt-7', new Date('2026-05-11T10:50:00.000Z'), null),
    ]);
    prismaMock.stripeEvent.findMany.mockResolvedValueOnce([
      buildStripeEvent('evt-7', new Date('2026-05-11T10:50:00.000Z'), null),
    ]);

    vi.setSystemTime(now);
    const result = await getFinanceAlerts();

    const backlog = result.alerts.find((alert) => alert.id === 'webhook-pending-backlog');
    const lag = result.alerts.find((alert) => alert.id === 'webhook-processing-lag');

    expect(backlog).toEqual(
      expect.objectContaining({
        severity: 'critical',
        metricValue: 5,
      }),
    );
    expect(lag).toEqual(
      expect.objectContaining({
        severity: 'critical',
      }),
    );
  });

  it('emits warning-level webhook alerts below critical thresholds', async () => {
    const now = new Date('2026-05-11T12:00:00.000Z');

    prismaMock.payment.findMany.mockResolvedValueOnce([]);
    prismaMock.payment.findMany.mockResolvedValueOnce([]);
    prismaMock.message.findMany.mockResolvedValueOnce([]);

    prismaMock.stripeEvent.findMany.mockResolvedValueOnce([
      buildStripeEvent('evt-1', new Date('2026-05-11T11:40:00.000Z'), new Date('2026-05-11T11:42:30.000Z')),
      buildStripeEvent('evt-2', new Date('2026-05-11T11:20:00.000Z'), null),
      buildStripeEvent('evt-3', new Date('2026-05-11T11:00:00.000Z'), null),
    ]);
    prismaMock.stripeEvent.findMany.mockResolvedValueOnce([
      buildStripeEvent('evt-3', new Date('2026-05-11T11:00:00.000Z'), null),
    ]);

    vi.setSystemTime(now);
    const result = await getFinanceAlerts();

    const backlog = result.alerts.find((alert) => alert.id === 'webhook-pending-backlog');
    const lag = result.alerts.find((alert) => alert.id === 'webhook-processing-lag');

    expect(backlog).toEqual(
      expect.objectContaining({
        severity: 'warning',
        metricValue: 2,
      }),
    );
    expect(lag).toEqual(
      expect.objectContaining({
        severity: 'warning',
      }),
    );
  });
});
