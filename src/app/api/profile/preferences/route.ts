import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

const preferencesSchema = z.object({
  bookingStatusEmailsEnabled: z.boolean(),
  productUpdatesEmailsEnabled: z.boolean(),
  marketingEmailsEnabled: z.boolean(),
});

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      bookingStatusEmailsEnabled: true,
      productUpdatesEmailsEnabled: true,
      marketingEmailsEnabled: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    preferences: {
      bookingStatusEmailsEnabled: user.bookingStatusEmailsEnabled,
      productUpdatesEmailsEnabled: user.productUpdatesEmailsEnabled,
      marketingEmailsEnabled: user.marketingEmailsEnabled,
    },
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
  });
}

export async function PUT(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: z.infer<typeof preferencesSchema>;
  try {
    payload = preferencesSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid preferences payload" }, { status: 422 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: payload,
    select: {
      bookingStatusEmailsEnabled: true,
      productUpdatesEmailsEnabled: true,
      marketingEmailsEnabled: true,
      lastLoginAt: true,
    },
  });

  return NextResponse.json({
    preferences: {
      bookingStatusEmailsEnabled: updated.bookingStatusEmailsEnabled,
      productUpdatesEmailsEnabled: updated.productUpdatesEmailsEnabled,
      marketingEmailsEnabled: updated.marketingEmailsEnabled,
    },
    lastLoginAt: updated.lastLoginAt?.toISOString() || null,
  });
}
