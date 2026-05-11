import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { id: string; role?: string }).role;
  if (!role || !["staff", "admin"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ pets: [] });
  }

  const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";
  const take = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? "100") || 100, 200);

  const pets = await prisma.pet.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { breed: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { user: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      breed: true,
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ name: "asc" }],
    take,
  });

  return NextResponse.json({ pets });
}
