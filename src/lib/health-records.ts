import { prisma, isDatabaseConfigured } from '@/lib/prisma';

export type WaiverType = 'liability' | 'medical' | 'photo_release';

export const WAIVER_CONTENT_BY_TYPE: Record<WaiverType, string> = {
  liability:
    'I accept the liability waiver and understand supervised dogs may still experience normal dog-behavior risks such as scratches, scrapes, or property damage.',
  medical:
    "I authorize Zaine's Stay & Play to seek emergency medical treatment for my pet if necessary, and I agree to cover all associated costs.",
  photo_release:
    'I consent to the use of photos and videos of my pet for promotional purposes.',
};

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