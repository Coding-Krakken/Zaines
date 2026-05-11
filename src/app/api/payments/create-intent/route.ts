import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  stripe,
  formatAmountForStripe,
  isStripeConfigured,
} from "@/lib/stripe";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import {
  errorResponse,
  getCorrelationId,
  logServerFailure,
  rateLimitedResponse,
} from "@/lib/security/api";

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
      checkInDate: Date;
      checkOutDate: Date;
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
        revenueRecognitionMethod: string;
        recognitionStatus: string;
        servicePeriodStart: Date;
        servicePeriodEnd: Date;
        deferredRevenueAmount: number;
        recognizedRevenueAmount: number;
        taxTreatment: string;
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
    const rateLimit = rateLimitedResponse({
      request,
      routeKey: "payments_create_intent",
      route: "/api/payments/create-intent",
      correlationId,
      limit: 10,
      windowMs: 60_000,
    });
    if (rateLimit) return rateLimit;

    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return errorResponse({
        status: 503,
        errorCode: "PAYMENT_PROVIDER_UNAVAILABLE",
        message: "Payment processing is temporarily unavailable.",
        retryable: true,
        correlationId,
      });
    }

    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return errorResponse({
        status: 503,
        errorCode: "PAYMENT_PERSISTENCE_UNAVAILABLE",
        message: "Payment processing is temporarily unavailable.",
        retryable: true,
        correlationId,
      });
    }

    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse({
        status: 401,
        errorCode: "AUTH_REQUIRED",
        message: "Authentication required",
        retryable: false,
        correlationId,
      });
    }

    const body = await request.json();
    const validation = paymentIntentSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse({
        status: 400,
        errorCode: "PAYMENT_VALIDATION_ERROR",
        message: "Invalid payment data",
        retryable: false,
        correlationId,
        details: createPaymentValidationDetails(validation.error),
      });
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
      return errorResponse({
        status: 404,
        errorCode: "BOOKING_NOT_FOUND",
        message: "Booking not found.",
        retryable: false,
        correlationId,
      });
    }

    // Verify user owns this booking or is authenticated
    if (booking.userId !== session.user.id) {
      return errorResponse({
        status: 403,
        errorCode: "BOOKING_ACCESS_DENIED",
        message: "Unauthorized - this booking belongs to another user",
        retryable: false,
        correlationId,
      });
    }

    // Verify amount matches booking
    if (Math.abs(booking.total - amount) > 0.01) {
      return errorResponse({
        status: 400,
        errorCode: "PAYMENT_AMOUNT_MISMATCH",
        message: "Payment amount does not match the booking total.",
        retryable: false,
        correlationId,
      });
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
      return errorResponse({
        status: 409,
        errorCode: "PAYMENT_ALREADY_EXISTS",
        message: "Payment already exists for this booking.",
        retryable: false,
        correlationId,
      });
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
    }, {
      idempotencyKey: `booking:${bookingId}:amount:${formatAmountForStripe(amount)}`,
    });

    // Create payment record in database
    await paymentPrisma.payment.create({
      data: {
        bookingId,
        amount: booking.total,
        currency: "usd",
        status: "pending",
        stripePaymentId: paymentIntent.id,
        revenueRecognitionMethod: "service_period",
        recognitionStatus: "pending_payment",
        servicePeriodStart: booking.checkInDate,
        servicePeriodEnd: booking.checkOutDate,
        deferredRevenueAmount: booking.total,
        recognizedRevenueAmount: 0,
        taxTreatment: "booking_taxable",
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
    return errorResponse({
      status: 500,
      errorCode: "PAYMENT_INTENT_CREATE_FAILED",
      message: "Failed to create payment intent. Please retry.",
      retryable: true,
      correlationId,
    });
  }
}
