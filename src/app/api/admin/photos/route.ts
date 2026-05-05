import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { validateFile } from '@/lib/file-upload';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;

async function requireStaffSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const role = (session.user as { id: string; role?: string }).role;
  if (!role || !['staff', 'admin'].includes(role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { session };
}

async function storeFile(file: File, bookingId: string): Promise<string> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (blobToken) {
    const { put } = await import('@vercel/blob');
    const key = `photos/${bookingId}/${Date.now()}-${file.name}`;
    const blob = await put(key, file, { access: 'public', token: blobToken });
    return blob.url;
  }

  // Local fallback for development/test environments.
  const localDir = path.join(process.cwd(), 'public', 'uploads', 'pet-photos');
  await mkdir(localDir, { recursive: true });

  const extension = path.extname(file.name) || '.jpg';
  const localName = `${Date.now()}-${randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(localDir, localName), buffer);

  return `/uploads/pet-photos/${localName}`;
}

export async function GET(request: NextRequest) {
  const authResult = await requireStaffSession();
  if (authResult.error) {
    return authResult.error;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ photos: [] });
  }

  const bookingId = request.nextUrl.searchParams.get('bookingId')?.trim();
  const take = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? '30') || 30, 100);

  const photos = await prisma.petPhoto.findMany({
    where: bookingId
      ? { bookingId }
      : {
          booking: {
            status: 'checked_in',
          },
        },
    include: {
      pet: {
        select: { id: true, name: true, breed: true },
      },
      booking: {
        select: { id: true, bookingNumber: true, status: true },
      },
    },
    orderBy: { uploadedAt: 'desc' },
    take,
  });

  return NextResponse.json({ photos });
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffSession();
  if (authResult.error) {
    return authResult.error;
  }

  const session = authResult.session;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const formData = await request.formData().catch(() => null);
  const bookingId = formData?.get('bookingId');
  const petId = formData?.get('petId');
  const caption = formData?.get('caption');
  const file = formData?.get('file');

  if (!bookingId || typeof bookingId !== 'string') {
    return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
  }
  if (!petId || typeof petId !== 'string') {
    return NextResponse.json({ error: 'petId is required' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const validation = validateFile(file, ALLOWED_IMAGE_TYPES, IMAGE_MAX_SIZE);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error ?? 'Invalid file' }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      bookingPets: {
        select: { petId: true },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.status !== 'checked_in') {
    return NextResponse.json(
      { error: `Cannot upload photo for booking with status: ${booking.status}` },
      { status: 409 },
    );
  }

  const petIsOnBooking = booking.bookingPets.some((bp) => bp.petId === petId);
  if (!petIsOnBooking) {
    return NextResponse.json(
      { error: 'Pet is not assigned to this booking' },
      { status: 409 },
    );
  }

  const imageUrl = await storeFile(file, bookingId);
  const uploadedBy = session.user!.name ?? session.user!.email ?? session.user!.id;

  const photo = await prisma.petPhoto.create({
    data: {
      bookingId,
      petId,
      imageUrl,
      caption: typeof caption === 'string' ? caption.trim() || null : null,
      uploadedBy,
    },
    include: {
      pet: { select: { id: true, name: true, breed: true } },
      booking: { select: { id: true, bookingNumber: true, status: true } },
    },
  });

  return NextResponse.json({ photo }, { status: 201 });
}
