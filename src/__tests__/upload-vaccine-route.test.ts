import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { authMock, prismaMock, mkdirMock, writeFileMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    pet: {
      findUnique: vi.fn(),
    },
  },
  mkdirMock: vi.fn(),
  writeFileMock: vi.fn(),
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
  const originalNodeEnv = process.env.NODE_ENV;
  const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.BLOB_READ_WRITE_TOKEN;
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    if (originalBlobToken === undefined) {
      delete process.env.BLOB_READ_WRITE_TOKEN;
    } else {
      process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;
    }

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns 503 in production when blob storage is not configured', async () => {
    process.env.NODE_ENV = 'production';

    const response = await POST(makeUploadRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'Vaccine uploads are temporarily unavailable. Storage is not configured.',
    });
    expect(mkdirMock).not.toHaveBeenCalled();
    expect(writeFileMock).not.toHaveBeenCalled();
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
});