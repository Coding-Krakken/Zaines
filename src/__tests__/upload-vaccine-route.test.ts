import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { authMock, prismaMock, mkdirMock, writeFileMock, blobPutMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    pet: {
      findUnique: vi.fn(),
    },
    vaccine: {
      create: vi.fn(),
    },
  },
  mkdirMock: vi.fn(),
  writeFileMock: vi.fn(),
  blobPutMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
  isDatabaseConfigured: vi.fn(() => true),
}));
vi.mock('fs/promises', () => ({
  mkdir: mkdirMock,
  writeFile: writeFileMock,
}));
vi.mock('@vercel/blob', () => ({
  put: blobPutMock,
}));

import { POST } from '@/app/api/upload/vaccine/route';

function makeUploadRequest(fileName = 'vaccines.pdf', petId = 'new-pet-1') {
  const formData = new FormData();
  formData.append('file', new File(['pdf-content'], fileName, { type: 'application/pdf' }));
  formData.append('petId', petId);

  return new NextRequest('http://localhost/api/upload/vaccine', {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/upload/vaccine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('stores uploads locally in production when blob storage is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    writeFileMock.mockResolvedValue(undefined);
    mkdirMock.mockResolvedValue(undefined);

    const response = await POST(makeUploadRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        fileName: 'vaccines.pdf',
        contentType: 'application/pdf',
        url: expect.stringMatching(/^\/uploads\/vaccines\//),
      }),
    );
  });

  it('stores uploads locally outside production when blob storage is not configured', async () => {
    writeFileMock.mockResolvedValue(undefined);
    mkdirMock.mockResolvedValue(undefined);

    const response = await POST(makeUploadRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        fileName: 'vaccines.pdf',
        contentType: 'application/pdf',
        url: expect.stringMatching(/^\/uploads\/vaccines\//),
      }),
    );
    expect(mkdirMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to local storage when blob upload fails', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'token-present-but-invalid');
    blobPutMock.mockRejectedValue(new Error('blob failed'));
    writeFileMock.mockResolvedValue(undefined);
    mkdirMock.mockResolvedValue(undefined);

    const response = await POST(makeUploadRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        fileName: 'vaccines.pdf',
        url: expect.stringMatching(/^\/uploads\/vaccines\//),
      }),
    );
    expect(blobPutMock).toHaveBeenCalledTimes(1);
    expect(mkdirMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock).toHaveBeenCalledTimes(1);
  });

  it('persists uploaded vaccine metadata for existing pets', async () => {
    writeFileMock.mockResolvedValue(undefined);
    mkdirMock.mockResolvedValue(undefined);
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    prismaMock.pet.findUnique.mockResolvedValue({ userId: 'user-1' });
    prismaMock.vaccine.create.mockResolvedValue({ id: 'vaccine-1' });

    const response = await POST(makeUploadRequest('vaccines.pdf', 'pet-1'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        savedToDatabase: true,
        fileName: 'vaccines.pdf',
      }),
    );
    expect(prismaMock.vaccine.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          petId: 'pet-1',
          documentUrl: expect.stringMatching(/^\/uploads\/vaccines\//),
        }),
      }),
    );
  });

  it('uses database-inline fallback when file storage is unavailable for existing pets', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'token-present-but-invalid');
    blobPutMock.mockRejectedValue(new Error('blob failed'));
    mkdirMock.mockRejectedValue(new Error('read-only filesystem'));
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    prismaMock.pet.findUnique.mockResolvedValue({ userId: 'user-1' });
    prismaMock.vaccine.create.mockResolvedValue({ id: 'v-inline-1' });

    const response = await POST(makeUploadRequest('vaccines.pdf', 'pet-1'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        savedToDatabase: true,
        storageMode: 'database-inline',
        url: '/api/vaccines/v-inline-1/document',
      }),
    );
    expect(prismaMock.vaccine.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          petId: 'pet-1',
          documentUrl: null,
          notes: expect.stringContaining('__INLINE_VACCINE_DOCUMENT_BASE64__:'),
        }),
      }),
    );
  });

  it('falls back to temp storage for guest uploads when public uploads directory is unavailable', async () => {
    mkdirMock
      .mockRejectedValueOnce(new Error('public uploads is read-only'))
      .mockResolvedValueOnce(undefined);
    writeFileMock.mockResolvedValue(undefined);

    const response = await POST(makeUploadRequest('guest-vaccine.pdf', 'new-pet-1'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        fileName: 'guest-vaccine.pdf',
        savedToDatabase: false,
        url: expect.stringMatching(/^\/api\/upload\/vaccine\/temp\//),
      }),
    );
    expect(mkdirMock).toHaveBeenCalledTimes(2);
    expect(writeFileMock).toHaveBeenCalledTimes(1);
  });
});