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
});