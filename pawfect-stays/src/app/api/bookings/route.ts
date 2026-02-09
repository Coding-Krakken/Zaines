import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { stripe, formatAmountForStripe, isStripeConfigured } from "@/lib/stripe";

const bookingSchema = z.object({
  checkIn: z.string(),
  checkOut: z.string(),
  suiteType: z.enum(["standard", "deluxe", "luxury"]),
  petCount: z.number().min(1).max(5),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  petNames: z.string().min(1, "Pet name(s) required"),
  specialRequests: z.string().optional(),
  addOns: z.array(z.string()).optional(),
});

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { 
          error: "Booking system is not available",
          message: "Database is not configured. Please set DATABASE_URL environment variable."
        },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const session = await auth();
    
    const body = await request.json();
    const validation = bookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid booking data", details: validation.error },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Calculate pricing
    const pricing = calculateBookingPrice(
      data.checkIn,
      data.checkOut,
      data.suiteType,
      data.petCount
    );

    // Check availability first
    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);

    const overlappingBookings = await prisma.booking.count({
      where: {
        suite: {
          tier: {
            equals: data.suiteType,
            mode: "insensitive",
          },
        },
        status: {
          in: ["confirmed", "checked_in"],
        },
        OR: [
          {
            checkInDate: {
              gte: checkInDate,
              lt: checkOutDate,
            },
          },
          {
            checkOutDate: {
              gt: checkInDate,
              lte: checkOutDate,
            },
          },
          {
            AND: [
              {
                checkInDate: {
                  lte: checkInDate,
                },
              },
              {
                checkOutDate: {
                  gte: checkOutDate,
                },
              },
            ],
          },
        ],
      },
    });

    // Suite capacity check
    const capacity = {
      standard: 10,
      deluxe: 8,
      luxury: 5,
    };

    if (overlappingBookings >= capacity[data.suiteType]) {
      return NextResponse.json(
        { error: "Selected suite type is not available for these dates" },
        { status: 409 }
      );
    }

    // Create or find user
    let user;
    if (session?.user?.id) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
    } else {
      user = await prisma.user.upsert({
        where: { email: data.email },
        create: {
          email: data.email,
          name: `${data.firstName} ${data.lastName}`,
          phone: data.phone,
        },
        update: {
          phone: data.phone,
        },
      });
    }

    // Find an available suite of the requested tier
    const availableSuite = await prisma.suite.findFirst({
      where: {
        tier: {
          equals: data.suiteType,
          mode: "insensitive",
        },
        isActive: true,
      },
    });

    if (!availableSuite) {
      return NextResponse.json(
        { error: "No suites available for the selected tier" },
        { status: 404 }
      );
    }

    // Generate booking number
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const bookingNumber = `PB-${dateStr}-${randomNum}`;

    // Calculate total nights
    const totalNights = Math.max(
      1,
      Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: user!.id,
        suiteId: availableSuite.id,
        bookingNumber,
        checkInDate,
        checkOutDate,
        totalNights,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        total: pricing.total,
        status: "pending",
        specialRequests: data.specialRequests || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        suite: {
          select: {
            id: true,
            name: true,
            tier: true,
            pricePerNight: true,
          },
        },
      },
    });

    // TODO: Send confirmation email

    // Create Stripe Payment Intent if Stripe is configured
    let clientSecret: string | undefined;
    if (isStripeConfigured()) {
      try {
        // Check if payment already exists for this booking (idempotency)
        const existingPayment = await prisma.payment.findFirst({
          where: {
            bookingId: booking.id,
          },
        });

        if (!existingPayment) {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: formatAmountForStripe(booking.total),
            currency: "usd",
            automatic_payment_methods: { enabled: true },
            metadata: {
              bookingId: booking.id,
              bookingNumber: booking.bookingNumber,
              userId: booking.userId,
            },
            description: `Booking #${booking.bookingNumber} at Pawfect Stays`,
            receipt_email: data.email,
          });

          // Create payment record
          await prisma.payment.create({
            data: {
              bookingId: booking.id,
              amount: booking.total,
              currency: "usd",
              status: "pending",
              stripePaymentId: paymentIntent.id,
            },
          });

          clientSecret = paymentIntent.client_secret || undefined;
        }
      } catch (error) {
        console.error("Failed to create payment intent:", error);
        // Don't fail booking if payment creation fails
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
        suite: booking.suite,
        total: booking.total,
        status: booking.status,
      },
      payment: clientSecret ? { clientSecret } : undefined,
      message: clientSecret
        ? "Booking created. Please complete payment."
        : "Booking created successfully.",
    }, { status: 201 });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Failed to create booking. Please try again." },
      { status: 500 }
    );
  }
}

// GET /api/bookings - Get user's bookings
export async function GET() {
  try {
    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { 
          error: "Booking system is not available",
          message: "Database is not configured. Please set DATABASE_URL environment variable."
        },
        { status: 400 }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        suite: {
          select: {
            name: true,
            tier: true,
            pricePerNight: true,
          },
        },
        bookingPets: {
          include: {
            pet: true,
          },
        },
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// Helper function to calculate pricing
function calculateBookingPrice(
  checkIn: string,
  checkOut: string,
  suiteType: string,
  petCount: number
): { subtotal: number; tax: number; total: number } {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const prices: Record<string, number> = {
    standard: 65,
    deluxe: 85,
    luxury: 120,
  };

  const nightlyRate = prices[suiteType] || 65;

  // Calculate base price
  let subtotal = nightlyRate * Math.max(1, nights);

  // Additional pet discount (15% off for 2nd pet, 20% off for 3rd+)
  if (petCount > 1) {
    const additionalPets = petCount - 1;
    const discount = petCount === 2 ? 0.15 : 0.20;
    subtotal += nightlyRate * nights * additionalPets * (1 - discount);
  }

  // Tax (10%)
  const tax = subtotal * 0.10;
  const total = subtotal + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
