import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { sendPaymentRecoveryLinkNotification } from "@/lib/notifications";
import { siteConfig } from "@/config/site";

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (!role || !["staff", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Booking id is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!booking.user?.email) {
      return NextResponse.json(
        { error: "Booking customer email is missing" },
        { status: 400 },
      );
    }

    const baseUrl = normalizeBaseUrl(
      process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || siteConfig.url,
    );
    const recoveryUrl = `${baseUrl}/book/recover/${booking.id}`;

    const notification = await sendPaymentRecoveryLinkNotification(
      booking.id,
      recoveryUrl,
      {
        bookingNumber: booking.bookingNumber,
        user: {
          name: booking.user.name ?? undefined,
          email: booking.user.email,
        },
      },
    );

    const message = await prisma.message.create({
      data: {
        bookingId: booking.id,
        userId: session.user.id,
        senderType: "staff",
        senderName: session.user.name || "Staff",
        content: `Payment recovery link sent to ${booking.user.email}: ${recoveryUrl}`,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      recoveryUrl,
      notification,
      messageId: message.id,
    });
  } catch (error) {
    console.error("Failed to send payment recovery link", error);
    return NextResponse.json(
      { error: "Failed to send payment recovery link" },
      { status: 500 },
    );
  }
}
