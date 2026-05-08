import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';

const INLINE_DOCUMENT_NOTE_PREFIX = '__INLINE_VACCINE_DOCUMENT_BASE64__:';

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

  const vaccine = await prisma.vaccine.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      documentUrl: true,
      notes: true,
      pet: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!vaccine) {
    return NextResponse.json({ error: 'Vaccine record not found' }, { status: 404 });
  }

  if (vaccine.pet.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (vaccine.documentUrl) {
    return NextResponse.redirect(vaccine.documentUrl, 302);
  }

  const inline = vaccine.notes?.startsWith(INLINE_DOCUMENT_NOTE_PREFIX)
    ? vaccine.notes.slice(INLINE_DOCUMENT_NOTE_PREFIX.length)
    : null;

  if (!inline) {
    return NextResponse.json({ error: 'No vaccine document found' }, { status: 404 });
  }

  const pdfBuffer = Buffer.from(inline, 'base64');
  const safeName = vaccine.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filename = `${safeName || 'vaccine-record'}-${vaccine.id}.pdf`;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
