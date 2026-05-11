import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import {
  WAIVER_CONTENT_BY_TYPE,
  getAccountWaiverExpiry,
  type WaiverType,
} from '@/lib/health-records';

type WaiverSignRequest = {
  signature: string;
  ipAddress?: string;
  userAgent?: string;
};

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as WaiverSignRequest | null;
  if (!body?.signature || body.signature.trim().length < 5) {
    return NextResponse.json(
      { error: 'A signature is required to sign waivers.' },
      { status: 400 },
    );
  }

  const now = new Date();
  const requestIp =
    body.ipAddress ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = body.userAgent || request.headers.get('user-agent') || undefined;

  const waiverTypes: WaiverType[] = ['liability', 'medical', 'photo_release'];

  const accountWaivers = await Promise.all(
    waiverTypes.map((type) =>
      prisma.accountWaiver.upsert({
        where: {
          userId_type: {
            userId: session.user.id,
            type,
          },
        },
        update: {
          content: WAIVER_CONTENT_BY_TYPE[type],
          signature: body.signature,
          signedAt: now,
          expiresAt: getAccountWaiverExpiry(type, now),
          ipAddress: requestIp,
          userAgent,
        },
        create: {
          userId: session.user.id,
          type,
          content: WAIVER_CONTENT_BY_TYPE[type],
          signature: body.signature,
          signedAt: now,
          expiresAt: getAccountWaiverExpiry(type, now),
          ipAddress: requestIp,
          userAgent,
        },
      }),
    ),
  );

  return NextResponse.json({
    success: true,
    accountWaivers,
  });
}
