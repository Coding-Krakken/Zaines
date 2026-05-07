import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { petSchema } from '@/lib/validations/pet';

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pets = await prisma.pet.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ pets });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  const result = petSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const pet = await prisma.pet.create({
      data: { ...result.data, userId: session.user.id },
    });

    return NextResponse.json({ pet }, { status: 201 });
  } catch (error) {
    // Generate correlation ID for request tracing
    const correlationId = crypto.randomUUID();
    
    // Log the error for debugging with correlation ID
    console.error('[API] Pet creation failed:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session.user.id,
    });
    
    // Return a properly formatted error response with correlation ID
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to create pet',
        message: errorMessage,
        code: 'PET_CREATION_ERROR',
        correlationId,
      },
      { status: 500 },
    );
  }
}
