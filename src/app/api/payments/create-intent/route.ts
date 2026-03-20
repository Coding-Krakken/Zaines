import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  stripe,
  formatAmountForStripe,
  isStripeConfigured,
} from "@/lib/stripe";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getCorrelationId, logServerFailure } from "@/lib/api/issue26";

type PaymentIntentPrisma = {
  booking: {
    findUnique: (args: {
      where: { id: string };
      include: { user: boolean };
    }) => Promise<{
      id: string;
      userId: string;
      bookingNumber: string;
      total: number;
      user: { email: string | null };
    } | null>;
  };
  payment: {
    findFirst: (args: {
      where: {
        bookingId: string;
        status: { in: string[] };
      };
    }) => Promise<{ id: string } | null>;
    create: (args: {
      data: {
        bookingId: string;
        amount: number;
        currency: string;
        status: string;
        stripePaymentId: string;
      };
    }) => Promise<unknown>;
  };
};

const paymentPrisma = prisma as unknown as PaymentIntentPrisma;

const paymentIntentSchema = z.object({
  bookingId: z.string(),
  amount: z.number().positive(),
});

function createPaymentValidationDetails(validationError: z.ZodError): {
  fields: string[];
} {
  const fields = validationError.issues
    .map((issue) => issue.path.join("."))
    .filter((field) => field.length > 0);

  const uniqueSortedFields = [...new Set(fields)].sort((left, right) =>
    left.localeCompare(right),
  );

  return { fields: uniqueSortedFields };
}

// POST /api/payments/create-intent - Create a Stripe Payment Intent
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error: "Payment processing is not available",
          message:
            "Stripe is not configured. Please contact support or set STRIPE_SECRET_KEY environment variable.",
        },
        { status: 400 },
      );
    }

    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          error: "Database is not available",
          message:
            "Database is not configured. Please set DATABASE_URL environment variable.",
        },
        { status: 400 },
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Authentication required",
          code: "AUTH_REQUIRED",
          correlationId,
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validation = paymentIntentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid payment data",
          code: "PAYMENT_VALIDATION_ERROR",
          details: createPaymentValidationDetails(validation.error),
          correlationId,
        },
        { status: 400 },
      );
    }

    const { bookingId, amount } = validation.data;

    // Fetch booking to verify ownership and amount
    const booking = await paymentPrisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify user owns this booking or is authenticated
    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized - this booking belongs to another user" },
        { status: 403 },
      );
    }

    // Verify amount matches booking
    if (Math.abs(booking.total - amount) > 0.01) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // Check if payment already exists for this booking
    const existingPayment = await paymentPrisma.payment.findFirst({
      where: {
        bookingId,
        status: {
          in: ["pending", "succeeded"],
        },
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "Payment already exists for this booking" },
        { status: 409 },
      );
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount),
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        bookingId,
        bookingNumber: booking.bookingNumber,
        userId: booking.userId,
      },
      description: `Booking #${booking.bookingNumber} at Zaine's Stay & Play`,
      receipt_email: booking.user.email || undefined,
    });

    // Create payment record in database
    await paymentPrisma.payment.create({
      data: {
        bookingId,
        amount: booking.total,
        currency: "usd",
        status: "pending",
        stripePaymentId: paymentIntent.id,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: unknown) {
    logServerFailure(
      "/api/payments/create-intent",
      "PAYMENT_INTENT_CREATE_FAILED",
      correlationId,
      error,
    );
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create payment intent";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
