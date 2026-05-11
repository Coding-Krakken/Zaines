import { prisma, isDatabaseConfigured } from '@/lib/prisma';

export type WaiverType = 'liability' | 'medical' | 'photo_release';

// Re-export from waiver-content for backward compatibility
export { WAIVER_CONTENT_BY_TYPE } from '@/lib/waiver-content';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function getAccountWaiverExpiry(type: WaiverType, signedAt: Date): Date | null {
  if (type === 'photo_release') {
    return null;
  }

  return new Date(signedAt.getTime() + ONE_YEAR_MS);
}

export function isAccountWaiverActive(waiver: { expiresAt: Date | null }): boolean {
  return waiver.expiresAt === null || waiver.expiresAt > new Date();
}

export async function getHealthRecordsForUser(userId: string) {
  if (!isDatabaseConfigured()) {
    return { accountWaivers: [], pets: [] };
  }

  const [accountWaivers, pets] = await Promise.all([
    prisma.accountWaiver.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { signedAt: 'desc' }],
    }),
    prisma.pet.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: {
        vaccines: {
          orderBy: { expiryDate: 'desc' },
        },
        medications: {
          orderBy: { startDate: 'desc' },
        },
      },
    }),
  ]);

  return { accountWaivers, pets };
}