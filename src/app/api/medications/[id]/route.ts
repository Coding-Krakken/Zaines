import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { medicationSchema } from '@/lib/validations/medication';

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
  const medication = await prisma.medication.findUnique({
    where: { id },
    include: {
      pet: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
    },
  });

  if (!medication) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (medication.pet.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ medication });
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
  const medication = await prisma.medication.findUnique({
    where: { id },
    include: {
      pet: {
        select: { userId: true },
      },
    },
  });

  if (!medication) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (medication.pet.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: unknown = await request.json();
  const result = medicationSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = await prisma.medication.update({
    where: { id },
    data: {
      ...result.data,
      startDate: new Date(result.data.startDate),
      endDate: result.data.endDate ? new Date(result.data.endDate) : null,
    },
    include: {
      pet: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({ medication: updated });
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
  const medication = await prisma.medication.findUnique({
    where: { id },
    include: {
      pet: {
        select: { userId: true },
      },
    },
  });

  if (!medication) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (medication.pet.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.medication.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
