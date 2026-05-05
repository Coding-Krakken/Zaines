import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getCorrelationId, logServerFailure } from "@/lib/api/issue26";
import { stripe, isStripeConfigured, formatAmountForStripe } from "@/lib/stripe";

type BookingCancelRecord = {
  id: string;
  userId: string;
  status: string;
  checkInDate: Date;
  total: number;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    stripePaymentId: string | null;
  }>;
};

type CancellationPolicyResult = {
  policyWindow: "full_refund" | "partial_refund" | "no_refund";
  refundEligibleAmount: number;
  message: string;
};

const HOURS_FULL_REFUND = 48;
const HOURS_PARTIAL_REFUND = 24;

function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function calculateCancellationPolicy(
  checkInDate: Date,
  bookingTotal: number,
  now: Date,
): CancellationPolicyResult {
  const msUntilCheckIn = checkInDate.getTime() - now.getTime();
  const hoursUntilCheckIn = msUntilCheckIn / (1000 * 60 * 60);

  if (hoursUntilCheckIn >= HOURS_FULL_REFUND) {
    return {
      policyWindow: "full_refund",
      refundEligibleAmount: roundCurrency(bookingTotal),
      message: "Cancellation accepted with full refund (48+ hours before check-in).",
    };
  }

  if (hoursUntilCheckIn >= HOURS_PARTIAL_REFUND) {
    return {
      policyWindow: "partial_refund",
      refundEligibleAmount: roundCurrency(bookingTotal * 0.5),
      message: "Cancellation accepted with 50% refund (24-48 hours before check-in).",
    };
  }

  return {
    policyWindow: "no_refund",
    refundEligibleAmount: 0,
    message: "Cancellation accepted. No refund is available within 24 hours of check-in.",
  };
}

function resolveRouteParams(context: { params: { id: string } | Promise<{ id: string }> }) {
  return Promise.resolve(context.params);
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  const correlationId = getCorrelationId(request);

  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          error: "Booking system is not available",
          message:
            "Database is not configured. Please set DATABASE_URL environment variable.",
        },
        { status: 400 },
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await resolveRouteParams(context);

    const booking = (await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            stripePaymentId: true,
          },
        },
      },
    })) as BookingCancelRecord | null;

    if (!booking || booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 },
      );
    }

    if (
      booking.status === "cancelled" ||
      booking.status === "completed" ||
      booking.status === "checked_in"
    ) {
      return NextResponse.json(
        { error: "Booking cannot be cancelled in its current status." },
        { status: 409 },
      );
    }

    const now = new Date();
    if (booking.checkInDate.getTime() <= now.getTime()) {
      return NextResponse.json(
        { error: "Booking cannot be cancelled on or after check-in." },
        { status: 409 },
      );
    }

    const policy = calculateCancellationPolicy(booking.checkInDate, booking.total, now);

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "cancelled" },
    });

    await prisma.payment.updateMany({
      where: {
        bookingId: booking.id,
        status: "pending",
      },
      data: {
        status: "cancelled",
      },
    });

    const succeededPayments = booking.payments.filter(
      (payment) => payment.status === "succeeded" && Boolean(payment.stripePaymentId),
    );

    let refundedAmount = 0;

    if (
      policy.refundEligibleAmount > 0 &&
      succeededPayments.length > 0 &&
      isStripeConfigured()
    ) {
      let remainingToRefund = policy.refundEligibleAmount;

      for (const payment of succeededPayments) {
        if (remainingToRefund <= 0) {
          break;
        }

        const paymentIntentId = payment.stripePaymentId;
        if (!paymentIntentId) {
          continue;
        }

        const amountForThisPayment = Math.min(remainingToRefund, payment.amount);
        if (amountForThisPayment <= 0) {
          continue;
        }

        await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: formatAmountForStripe(amountForThisPayment),
        });

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "refunded",
            refundedAt: now,
            refundAmount: roundCurrency(amountForThisPayment),
          },
        });

        refundedAmount = roundCurrency(refundedAmount + amountForThisPayment);
        remainingToRefund = roundCurrency(remainingToRefund - amountForThisPayment);
      }
    }

    const refundPendingAmount = roundCurrency(
      Math.max(0, policy.refundEligibleAmount - refundedAmount),
    );

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      status: "cancelled",
      cancellation: {
        policyWindow: policy.policyWindow,
        refundEligibleAmount: policy.refundEligibleAmount,
        refundedAmount,
        refundPendingAmount,
        currency: "USD",
        message:
          refundPendingAmount > 0
            ? `${policy.message} Refund pending amount: $${refundPendingAmount.toFixed(2)}.`
            : policy.message,
      },
      correlationId,
    });
  } catch (error) {
    logServerFailure(
      "/api/bookings/[id]/cancel",
      "BOOKING_CANCELLATION_FAILED",
      correlationId,
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to cancel booking. Please try again.",
        correlationId,
      },
      { status: 500 },
    );
  }
}
