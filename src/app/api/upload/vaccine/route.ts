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
    try {
      const { put } = await import('@vercel/blob');
      const key = `vaccines/${petId}/${Date.now()}-${file.name}`;
      const blob = await put(key, file, { access: 'public', token: blobToken });
      return blob.url;
    } catch (blobError) {
      console.error('Vercel Blob upload failed:', {
        errorName: blobError instanceof Error ? blobError.name : 'Unknown',
        errorMessage: blobError instanceof Error ? blobError.message : String(blobError),
      });
      throw new VaccineUploadStorageError(
        'Vaccine storage service is temporarily unavailable. Please try again later.',
        503,
      );
    }
  }

  // Local filesystem fallback (works for dev/test and stateful production hosts).
  try {
    const localDir = path.join(process.cwd(), 'public', 'uploads', 'vaccines');
    
    try {
      await mkdir(localDir, { recursive: true });
    } catch (mkdirError) {
      console.error('Failed to create uploads directory:', {
        path: localDir,
        cwd: process.cwd(),
        errorName: mkdirError instanceof Error ? mkdirError.name : 'Unknown',
        errorMessage: mkdirError instanceof Error ? mkdirError.message : String(mkdirError),
      });
      
      throw new VaccineUploadStorageError(
        'Storage directory is not accessible. Please contact support.',
        503,
      );
    }

    const extension = path.extname(file.name) || '.pdf';
    const localName = `${Date.now()}-${randomUUID()}${extension}`;
    const filePath = path.join(localDir, localName);
    
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (fileError) {
      console.error('File buffer conversion failed:', {
        errorName: fileError instanceof Error ? fileError.name : 'Unknown',
        errorMessage: fileError instanceof Error ? fileError.message : String(fileError),
        fileName: file.name,
        fileSize: file.size,
      });
      throw fileError;
    }

    try {
      await writeFile(filePath, buffer);
    } catch (writeError) {
      console.error('Failed to write vaccine file:', {
        path: filePath,
        errorName: writeError instanceof Error ? writeError.name : 'Unknown',
        errorMessage: writeError instanceof Error ? writeError.message : String(writeError),
      });
      
      throw new VaccineUploadStorageError(
        'Failed to save vaccine file. Please try again later.',
        503,
      );
    }

    return `/uploads/vaccines/${localName}`;
  } catch (localStorageError) {
    if (localStorageError instanceof VaccineUploadStorageError) {
      throw localStorageError;
    }
    
    console.error('Local storage error:', {
      errorName: localStorageError instanceof Error ? localStorageError.name : 'Unknown',
      errorMessage: localStorageError instanceof Error ? localStorageError.message : String(localStorageError),
      cwd: process.cwd(),
    });
    
    throw new VaccineUploadStorageError(
      blobToken
        ? 'Failed to store vaccine record. Please check server logs.'
        : 'Vaccine uploads are unavailable. Configure BLOB_READ_WRITE_TOKEN or enable writable uploads storage.',
      503,
    );
  }
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
    let formData: FormData | null = null;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error('FormData parsing error:', formError);
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    if (!formData) {
      return NextResponse.json({ error: 'No form data provided' }, { status: 400 });
    }

    const file = formData.get('file');
    const petId = formData.get('petId');

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

    let url: string;
    try {
      url = await storeFile(file, petId);
    } catch (storageError) {
      if (storageError instanceof VaccineUploadStorageError) {
        console.warn('Storage error:', storageError.message);
        return NextResponse.json({ error: storageError.message }, { status: storageError.status });
      }
      
      console.error('File storage error:', storageError, {
        errorName: storageError instanceof Error ? storageError.name : 'Unknown',
        errorMessage: storageError instanceof Error ? storageError.message : String(storageError),
        petId,
        fileName: file.name,
        fileSize: file.size,
      });
      
      throw storageError;
    }

    return NextResponse.json(
      {
        url,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    if (error instanceof VaccineUploadStorageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    // Safely serialize error for logging
    let errorDetails: Record<string, unknown> = {};
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else {
      errorDetails = {
        error: String(error),
      };
    }

    console.error('Vaccine upload failed:', errorDetails);

    return NextResponse.json(
      { error: 'Unable to upload vaccine record right now. Please try again later.' },
      { status: 500 },
    );
  }
}
