import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { validateFile } from '@/lib/file-upload';

const ALLOWED_PDF_TYPES = ['application/pdf'];
const PDF_MAX_SIZE = 10 * 1024 * 1024;

class VaccineUploadStorageError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'VaccineUploadStorageError';
  }
}

function isTemporaryPetId(petId: string): boolean {
  return petId.startsWith('new-');
}

async function storeFile(file: File, petId: string): Promise<string> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (blobToken) {
    const { put } = await import('@vercel/blob');
    const key = `vaccines/${petId}/${Date.now()}-${file.name}`;
    const blob = await put(key, file, { access: 'public', token: blobToken });
    return blob.url;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new VaccineUploadStorageError(
      'Vaccine uploads are temporarily unavailable. Storage is not configured.',
      503,
    );
  }

  // Local fallback for development/test environments.
  const localDir = path.join(process.cwd(), 'public', 'uploads', 'vaccines');
  await mkdir(localDir, { recursive: true });

  const extension = path.extname(file.name) || '.pdf';
  const localName = `${Date.now()}-${randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(localDir, localName), buffer);

  return `/uploads/vaccines/${localName}`;
}

async function assertPetOwnership(petId: string, userId: string): Promise<NextResponse | null> {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { userId: true },
  });

  if (!pet) {
    return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
  }

  if (pet.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData().catch(() => null);
    const file = formData?.get('file');
    const petId = formData?.get('petId');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (!petId || typeof petId !== 'string') {
      return NextResponse.json({ error: 'petId is required' }, { status: 400 });
    }

    const validation = validateFile(file, ALLOWED_PDF_TYPES, PDF_MAX_SIZE);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error ?? 'Invalid file' }, { status: 400 });
    }

    // Existing pets must be authenticated and owned by the requester.
    if (!isTemporaryPetId(petId)) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const ownershipError = await assertPetOwnership(petId, session.user.id);
      if (ownershipError) {
        return ownershipError;
      }
    }

    const url = await storeFile(file, petId);

    return NextResponse.json(
      {
        url,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof VaccineUploadStorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Vaccine upload failed:', error);
    return NextResponse.json(
      { error: 'Unable to upload vaccine record right now. Please try again later.' },
      { status: 500 },
    );
  }
}
