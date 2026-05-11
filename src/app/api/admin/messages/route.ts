import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { ASSOCIATION_AUDIT_PREFIX } from "@/lib/api/reassociation-audit";

const FINANCE_AUDIT_PREFIX = "[FINANCE_AUDIT]";

async function requireStaffSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = (session.user as { id: string; role?: string }).role;
  if (!role || !["staff", "admin"].includes(role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session };
}

export async function GET(request: NextRequest) {
  const authResult = await requireStaffSession();
  if (authResult.error) {
    return authResult.error;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ messages: [] });
  }

  const includeUnassigned = request.nextUrl.searchParams.get("includeUnassigned") !== "false";
  const take = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? "100") || 100, 200);

  const messages = await prisma.message.findMany({
    where: {
      ...(includeUnassigned ? {} : { bookingId: { not: null } }),
      NOT: [
        {
          content: {
            startsWith: FINANCE_AUDIT_PREFIX,
          },
        },
        {
          content: {
            startsWith: ASSOCIATION_AUDIT_PREFIX,
          },
        },
      ],
    },
    select: {
      id: true,
      bookingId: true,
      userId: true,
      senderType: true,
      senderName: true,
      content: true,
      isRead: true,
      sentAt: true,
      booking: {
        select: {
          id: true,
          bookingNumber: true,
          status: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { sentAt: "desc" },
    take,
  });

  return NextResponse.json({ messages });
}
