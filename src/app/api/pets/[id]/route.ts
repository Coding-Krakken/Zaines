import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { petSchema } from '@/lib/validations/pet';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const pet = await prisma.pet.findUnique({ where: { id } });
  if (!pet) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (pet.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ pet });
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const pet = await prisma.pet.findUnique({ where: { id } });
  if (!pet) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (pet.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: unknown = await request.json();
  const result = petSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = await prisma.pet.update({
    where: { id },
    data: result.data,
  });

  return NextResponse.json({ pet: updated });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const pet = await prisma.pet.findUnique({ where: { id } });
  if (!pet) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (pet.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.pet.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}

