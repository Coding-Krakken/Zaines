import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthRuntimeConfig } from "@/lib/auth/runtime-config";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

type SessionDeleteBody = {
  sessionId?: string;
};

function getCurrentSessionToken(cookieStore: Awaited<ReturnType<typeof cookies>>): string | null {
  return (
    cookieStore.get("__Secure-authjs.session-token")?.value ||
    cookieStore.get("authjs.session-token")?.value ||
    null
  );
}

export async function GET() {
  const hasDatabase = isDatabaseConfigured();
  if (!hasDatabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  const authRuntime = getAuthRuntimeConfig(hasDatabase);

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const currentToken = getCurrentSessionToken(cookieStore);
  const currentUserAgent = requestHeaders.get("user-agent") || null;

  const sessions = await prisma.session.findMany({
    where: { userId: session.user.id },
    orderBy: { expires: "desc" },
    select: {
      id: true,
      sessionToken: true,
      expires: true,
    },
  });

  const activityStore = (
    prisma as unknown as {
      loginActivity?: {
        findMany: (args: {
          where: { userId: string };
          orderBy: { createdAt: "desc" };
          take: number;
          select: {
            id: true;
            eventType: true;
            provider: true;
            ipAddress: true;
            userAgent: true;
            isSuspicious: true;
            createdAt: true;
          };
        }) => Promise<
          Array<{
            id: string;
            eventType: string;
            provider: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            isSuspicious: boolean;
            createdAt: Date;
          }>
        >;
      };
    }
  ).loginActivity;

  const activity = activityStore
    ? await activityStore.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          eventType: true,
          provider: true,
          ipAddress: true,
          userAgent: true,
          isSuspicious: true,
          createdAt: true,
        },
      })
    : [];

  return NextResponse.json({
    strategy: authRuntime.sessionStrategy,
    sessions: sessions.map((entry) => ({
      id: entry.id,
      expiresAt: entry.expires.toISOString(),
      current: currentToken ? entry.sessionToken === currentToken : false,
      deviceHint: currentToken && entry.sessionToken === currentToken ? currentUserAgent : null,
    })),
    activity: activity.map((entry) => ({
      id: entry.id,
      eventType: entry.eventType,
      provider: entry.provider,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      isSuspicious: entry.isSuspicious,
      createdAt: entry.createdAt.toISOString(),
    })),
  });
}

export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as SessionDeleteBody;

  if (!body.sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 422 });
  }

  const existing = await prisma.session.findFirst({
    where: { id: body.sessionId, userId: session.user.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  await prisma.session.delete({ where: { id: body.sessionId } });

  return NextResponse.json({ state: "revoked" });
}
