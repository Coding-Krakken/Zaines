import { readFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

function resolveStorageDirectory(): string {
  const configuredDir = process.env.VACCINE_UPLOADS_DIR?.trim();
  if (configuredDir) {
    return path.isAbsolute(configuredDir)
      ? configuredDir
      : path.join(process.cwd(), configuredDir);
  }

  return path.join(os.tmpdir(), 'zaines', 'uploads', 'vaccines');
}

function isSafeFileName(fileName: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(fileName);
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ fileName: string }> },
) {
  const params = await context.params;
  const fileName = params.fileName;

  if (!isSafeFileName(fileName)) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
  }

  const storageDirectory = resolveStorageDirectory();
  const filePath = path.join(storageDirectory, fileName);

  try {
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'private, max-age=300',
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }
}
