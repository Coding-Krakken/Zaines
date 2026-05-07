import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { petSchema } from '@/lib/validations/pet';

function isSchemaDriftError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes('does not exist') ||
    error.message.includes('P2021') ||
    error.message.includes('P2022')
  );
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let pets;
  try {
    pets = await prisma.pet.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    if (!isSchemaDriftError(error)) {
      throw error;
    }

    // Fallback for partially migrated environments missing createdAt.
    pets = await prisma.pet.findMany({
      where: { userId: session.user.id },
    });
  }

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
    const fullData = { ...result.data, userId: session.user.id };
    let pet;

    try {
      pet = await prisma.pet.create({
        data: fullData,
      });
    } catch (error) {
      if (!isSchemaDriftError(error)) {
        throw error;
      }

      // Fallback write path when optional columns are not present yet.
      pet = await prisma.pet.create({
        data: {
          userId: session.user.id,
          name: result.data.name,
          breed: result.data.breed,
          age: result.data.age,
          weight: result.data.weight,
          gender: result.data.gender,
          spayedNeutered: result.data.spayedNeutered,
        },
      });
    }

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
