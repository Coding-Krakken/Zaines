import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';

const updateProfileSchema = z.object({
  name: z.string().max(100).optional(),
  phone: z.union([z.string().max(20), z.literal('')]).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ user: null });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true },
  });
  return NextResponse.json({ user });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const body: unknown = await request.json();
  const result = updateProfileSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, phone } = result.data;
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name ?? undefined,
      phone: phone === '' ? null : (phone ?? undefined),
    },
    select: { id: true, name: true, email: true, phone: true },
  });
  return NextResponse.json({ user: updated });
}
