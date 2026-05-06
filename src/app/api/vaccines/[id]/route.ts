import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { vaccineSchema } from "@/lib/validations/vaccine";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
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

  const { id } = await params;
  const vaccine = await prisma.vaccine.findUnique({
    where: { id },
    include: {
      pet: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
    },
  });

  if (!vaccine) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (vaccine.pet.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ vaccine });
}

export async function PUT(request: Request, { params }: RouteContext) {
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

  const { id } = await params;
  const vaccine = await prisma.vaccine.findUnique({
    where: { id },
    include: {
      pet: {
        select: { userId: true },
      },
    },
  });

  if (!vaccine) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (vaccine.pet.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await request.json();
  const result = vaccineSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = await prisma.vaccine.update({
    where: { id },
    data: {
      ...result.data,
      administeredDate: new Date(result.data.administeredDate),
      expiryDate: new Date(result.data.expiryDate),
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

  return NextResponse.json({ vaccine: updated });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
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

  const { id } = await params;
  const vaccine = await prisma.vaccine.findUnique({
    where: { id },
    include: {
      pet: {
        select: { userId: true },
      },
    },
  });

  if (!vaccine) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (vaccine.pet.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.vaccine.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
