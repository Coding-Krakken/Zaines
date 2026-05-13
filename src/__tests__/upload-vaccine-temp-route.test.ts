import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { readFileMock } = vi.hoisted(() => ({
  readFileMock: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  readFile: readFileMock,
}));

import { GET } from '@/app/api/upload/vaccine/temp/[fileName]/route';

describe('GET /api/upload/vaccine/temp/[fileName]', () => {
  it('returns 400 for invalid file names', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/upload/vaccine/temp/../../etc/passwd'),
      { params: Promise.resolve({ fileName: '../unsafe.pdf' }) },
    );

    expect(response.status).toBe(400);
  });

  it('returns file content for valid uploaded documents', async () => {
    readFileMock.mockResolvedValue(Buffer.from('pdf-data'));

    const response = await GET(
      new NextRequest('http://localhost/api/upload/vaccine/temp/file.pdf'),
      { params: Promise.resolve({ fileName: '123-file.pdf' }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    await expect(response.arrayBuffer()).resolves.toEqual(expect.any(ArrayBuffer));
  });

  it('returns 404 when temp document does not exist', async () => {
    readFileMock.mockRejectedValue(new Error('missing'));

    const response = await GET(
      new NextRequest('http://localhost/api/upload/vaccine/temp/missing.pdf'),
      { params: Promise.resolve({ fileName: 'missing.pdf' }) },
    );

    expect(response.status).toBe(404);
  });
});
