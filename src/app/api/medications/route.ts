import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { medicationSchema } from "@/lib/validations/medication";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("petId");

  // Build query based on whether petId is provided
  const whereClause = petId
    ? { pet: { id: petId, userId: session.user.id } }
    : { pet: { userId: session.user.id } };

  const medications = await prisma.medication.findMany({
    where: whereClause,
    include: {
      pet: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json({ medications });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const { petId, ...medicationData } = body as { petId?: string };

  if (!petId) {
    return NextResponse.json({ error: "petId is required" }, { status: 400 });
  }

  // Verify pet ownership
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { userId: true },
  });

  if (!pet) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  if (pet.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = medicationSchema.safeParse(medicationData);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const medication = await prisma.medication.create({
    data: {
      ...result.data,
      petId,
      startDate: new Date(result.data.startDate),
      endDate: result.data.endDate ? new Date(result.data.endDate) : null,
    },
    include: {
      pet: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({ medication }, { status: 201 });
}
