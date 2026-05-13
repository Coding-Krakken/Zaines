import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { validateFile } from '@/lib/file-upload';

const ALLOWED_PDF_TYPES = ['application/pdf'];
const PDF_MAX_SIZE = 10 * 1024 * 1024;
const INLINE_DOCUMENT_NOTE_PREFIX = '__INLINE_VACCINE_DOCUMENT_BASE64__:';

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

function deriveVaccineNameFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, '');
  const normalized = withoutExtension.replace(/[_-]+/g, ' ').trim();
  if (!normalized) return 'Uploaded Vaccination Record';
  return normalized.slice(0, 120);
}

function deriveDefaultExpiryDate(administeredDate: Date): Date {
  const expiry = new Date(administeredDate);
  expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry;
}

async function persistUploadedVaccineRecord(params: {
  petId: string;
  fileName: string;
  fileUrl: string;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw new VaccineUploadStorageError(
      'Database not configured for vaccine record persistence.',
      503,
    );
  }

  const administeredDate = new Date();
  const expiryDate = deriveDefaultExpiryDate(administeredDate);

  await prisma.vaccine.create({
    data: {
      petId: params.petId,
      name: deriveVaccineNameFromFileName(params.fileName),
      administeredDate,
      expiryDate,
      documentUrl: params.fileUrl,
      notes: 'Auto-generated from vaccine document upload.',
    },
  });
}

async function persistInlineVaccineDocument(params: {
  petId: string;
  fileName: string;
  file: File;
}): Promise<string> {
  if (!isDatabaseConfigured()) {
    throw new VaccineUploadStorageError(
      'Database not configured for vaccine record persistence.',
      503,
    );
  }

  const administeredDate = new Date();
  const expiryDate = deriveDefaultExpiryDate(administeredDate);
  const arrayBuffer = await params.file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  const vaccine = await prisma.vaccine.create({
    data: {
      petId: params.petId,
      name: deriveVaccineNameFromFileName(params.fileName),
      administeredDate,
      expiryDate,
      documentUrl: null,
      notes: `${INLINE_DOCUMENT_NOTE_PREFIX}${base64}`,
    },
    select: { id: true },
  });

  return `/api/vaccines/${vaccine.id}/document`;
}

type StorageTarget = {
  directory: string;
  toPublicUrl: (fileName: string) => string;
};

function getStorageTargets(petId: string): StorageTarget[] {
  const targets: StorageTarget[] = [];

  const configuredDir = process.env.VACCINE_UPLOADS_DIR?.trim();
  if (configuredDir) {
    const resolvedConfiguredDir = path.isAbsolute(configuredDir)
      ? configuredDir
      : path.join(process.cwd(), configuredDir);

    targets.push({
      directory: resolvedConfiguredDir,
      toPublicUrl: (fileName: string) => `/api/upload/vaccine/temp/${fileName}`,
    });
  }

  targets.push({
    directory: path.join(process.cwd(), 'public', 'uploads', 'vaccines'),
    toPublicUrl: (fileName: string) => `/uploads/vaccines/${fileName}`,
  });

  if (isTemporaryPetId(petId)) {
    targets.push({
      directory: path.join(os.tmpdir(), 'zaines', 'uploads', 'vaccines'),
      toPublicUrl: (fileName: string) => `/api/upload/vaccine/temp/${fileName}`,
    });
  }

  return targets;
}

async function storeFile(file: File, petId: string): Promise<string> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  let blobUploadFailed = false;

  if (blobToken) {
    try {
      const { put } = await import('@vercel/blob');
      const key = `vaccines/${petId}/${Date.now()}-${file.name}`;
      const blob = await put(key, file, { access: 'public', token: blobToken });
      return blob.url;
    } catch (blobError) {
      blobUploadFailed = true;
      console.error('Vercel Blob upload failed:', {
        errorName: blobError instanceof Error ? blobError.name : 'Unknown',
        errorMessage: blobError instanceof Error ? blobError.message : String(blobError),
      });
    }
  }

  // Local filesystem fallback (works for dev/test and stateful production hosts).
  try {
    const extension = path.extname(file.name) || '.pdf';
    const localName = `${Date.now()}-${randomUUID()}${extension}`;

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

    const storageTargets = getStorageTargets(petId);
    let lastStorageError: unknown = null;

    for (const target of storageTargets) {
      try {
        await mkdir(target.directory, { recursive: true });
      } catch (mkdirError) {
        lastStorageError = mkdirError;
        console.error('Failed to create uploads directory:', {
          path: target.directory,
          cwd: process.cwd(),
          errorName: mkdirError instanceof Error ? mkdirError.name : 'Unknown',
          errorMessage: mkdirError instanceof Error ? mkdirError.message : String(mkdirError),
        });
        continue;
      }

      const filePath = path.join(target.directory, localName);

      try {
        await writeFile(filePath, buffer);
        return target.toPublicUrl(localName);
      } catch (writeError) {
        lastStorageError = writeError;
        console.error('Failed to write vaccine file:', {
          path: filePath,
          errorName: writeError instanceof Error ? writeError.name : 'Unknown',
          errorMessage: writeError instanceof Error ? writeError.message : String(writeError),
        });
      }
    }

    throw new VaccineUploadStorageError(
      lastStorageError
        ? 'Storage directory is not accessible. Please contact support.'
        : 'Failed to save vaccine file. Please try again later.',
      503,
    );
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
      blobUploadFailed
        ? 'Vaccine storage service is temporarily unavailable. Please try again later.'
        : blobToken
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
    let persistedViaInlineFallback = false;
    try {
      url = await storeFile(file, petId);
    } catch (storageError) {
      if (storageError instanceof VaccineUploadStorageError) {
        const shouldPersistToDatabase = !isTemporaryPetId(petId);
        if (!shouldPersistToDatabase) {
          console.warn('Storage error:', storageError.message);
          return NextResponse.json(
            { error: storageError.message },
            { status: storageError.status },
          );
        }

        try {
          url = await persistInlineVaccineDocument({
            petId,
            fileName: file.name,
            file,
          });
          persistedViaInlineFallback = true;
        } catch (inlinePersistenceError) {
          console.error('Inline vaccine persistence failed:', {
            errorName:
              inlinePersistenceError instanceof Error
                ? inlinePersistenceError.name
                : 'Unknown',
            errorMessage:
              inlinePersistenceError instanceof Error
                ? inlinePersistenceError.message
                : String(inlinePersistenceError),
            petId,
            fileName: file.name,
          });

          return NextResponse.json(
            { error: storageError.message },
            { status: storageError.status },
          );
        }

        // Inline fallback succeeded; continue with normal success path.
      } else {
        console.error('File storage error:', storageError, {
          errorName: storageError instanceof Error ? storageError.name : 'Unknown',
          errorMessage: storageError instanceof Error ? storageError.message : String(storageError),
          petId,
          fileName: file.name,
          fileSize: file.size,
        });

        throw storageError;
      }
    }

    const shouldPersistToDatabase = !isTemporaryPetId(petId);

    if (shouldPersistToDatabase && !persistedViaInlineFallback) {
      try {
        await persistUploadedVaccineRecord({
          petId,
          fileName: file.name,
          fileUrl: url,
        });
      } catch (persistenceError) {
        console.error('Vaccine record persistence failed:', {
          errorName:
            persistenceError instanceof Error
              ? persistenceError.name
              : 'Unknown',
          errorMessage:
            persistenceError instanceof Error
              ? persistenceError.message
              : String(persistenceError),
          petId,
          fileName: file.name,
          fileUrl: url,
        });

        if (persistenceError instanceof VaccineUploadStorageError) {
          return NextResponse.json(
            { error: persistenceError.message },
            { status: persistenceError.status },
          );
        }

        return NextResponse.json(
          { error: 'Failed to save vaccine record to the database.' },
          { status: 503 },
        );
      }
    }

    return NextResponse.json(
      {
        url,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        savedToDatabase: shouldPersistToDatabase,
        storageMode: persistedViaInlineFallback ? 'database-inline' : 'file-url',
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
