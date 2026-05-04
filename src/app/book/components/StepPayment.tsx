"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import {
  stepPaymentSchema,
  type StepPaymentData,
} from "@/lib/validations/booking-wizard";
import { getStripe } from "@/lib/stripe-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StepPaymentProps {
  data: Partial<StepPaymentData> & {
    clientSecret?: string;
    pricingDisclosureAccepted?: boolean;
    bookingId?: string;
  };
  onUpdate: (
    data: Partial<StepPaymentData> & {
      clientSecret?: string;
      pricingDisclosureAccepted?: boolean;
      bookingId?: string;
    },
  ) => void;
  onNext: () => void;
  onBack: () => void;
  totalAmount: number; // From previous steps
  pricingQuote: {
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    pricingModelLabel: string;
    disclosure: string;
  } | null;
  bookingPayload: {
    checkIn: string;
    checkOut: string;
    suiteType: "standard" | "deluxe" | "luxury";
    petCount: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    petNames: string;
    specialRequests?: string;
    addOns?: Array<{ id: string; quantity: number }>;
    newPets?: Array<{
      name: string;
      breed: string;
      age: number;
      weight: number;
      gender: "male" | "female";
      temperament?: "friendly" | "shy" | "energetic" | "calm" | "anxious";
      specialNeeds?: string;
      feedingInstructions?: string;
    }>;
    vaccines?: Array<{
      petId: string;
      fileUrl: string;
      fileName: string;
      fileSize: number;
    }>;
    waiver: {
      liabilityAccepted: boolean;
      medicalAuthorizationAccepted: boolean;
      photoReleaseAccepted: boolean;
      signature: string;
    };
  } | null;
}

const BOOKING_PRICING_MODEL_LABEL = "Pre-confirmation estimate";
const BOOKING_PRICING_DISCLOSURE =
  "Total price is shown before confirmation with no hidden fees or surprise add-ons.";

function PaymentForm({
  onSuccess,
  onBack,
  disclosureAccepted,
  totalWithTax,
}: {
  onSuccess: () => void;
  onBack: () => void;
  disclosureAccepted: boolean;
  totalWithTax: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast.success("Payment successful!");
        onSuccess();
      }
    } catch {
      toast.error("An error occurred during payment");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing || !disclosureAccepted}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Confirm & Pay ${totalWithTax.toFixed(2)}
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function StepPayment({
  data,
  onUpdate,
  onNext,
  onBack,
  totalAmount,
  pricingQuote,
  bookingPayload,
}: StepPaymentProps) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState(data.clientSecret || "");
  const [bookingId, setBookingId] = useState(data.bookingId || "");
  const [pricingDisclosureAccepted, setPricingDisclosureAccepted] = useState(
    Boolean(data.pricingDisclosureAccepted),
  );
  const [bookingError, setBookingError] = useState<string>("");
  const [hasAttemptedInit, setHasAttemptedInit] = useState(
    Boolean(data.bookingId),
  );
  const [isLoading, setIsLoading] = useState(false);
  const subtotal = Math.round((pricingQuote?.subtotal || 0) * 100) / 100;
  const tax = Math.round((pricingQuote?.tax || 0) * 100) / 100;
  const totalWithTax = Math.round((pricingQuote?.total || totalAmount) * 100) / 100;

  const finalizeBooking = () => {
    if (!bookingId || !bookingPayload) {
      toast.error("Booking details are incomplete. Please retry.");
      return;
    }

    if (!pricingDisclosureAccepted) {
      toast.error("Please acknowledge pricing disclosure before confirming.");
      return;
    }

    const validation = stepPaymentSchema.safeParse({
      paymentOption: "full",
      amount: totalWithTax,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    onUpdate({
      paymentOption: "full",
      amount: totalWithTax,
      pricingDisclosureAccepted,
      bookingId,
    });

    onNext();
    router.push(`/book/confirmation?bookingId=${bookingId}`);
  };

  const initializeBookingAndPayment = useCallback(async () => {
    if (!bookingPayload) {
      setBookingError("Complete all previous steps before submitting payment.");
      return;
    }

    if (!pricingQuote) {
      setBookingError("Pricing validation is required before payment.");
      return;
    }

    setIsLoading(true);
    setBookingError("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        throw new Error(
          errorBody.error ||
            errorBody.message ||
            "Failed to initialize booking payment",
        );
      }

      const payload = (await response.json()) as {
        booking: { id: string; bookingNumber?: string };
        pricing: {
          subtotal: number;
          tax: number;
          total: number;
          currency: string;
        };
        payment?: { clientSecret?: string };
      };

      if (Math.abs(payload.pricing.total - pricingQuote.total) > 0.01) {
        throw new Error("Pricing changed during booking. Please review and retry.");
      }

      const nextBookingId = payload.booking.id;
      const nextClientSecret = payload.payment?.clientSecret || "";

      sessionStorage.setItem(
        `booking-${nextBookingId}`,
        JSON.stringify({
          id: nextBookingId,
          bookingNumber: payload.booking.bookingNumber || nextBookingId,
          checkIn: bookingPayload.checkIn,
          checkOut: bookingPayload.checkOut,
          suite: bookingPayload.suiteType,
          pricing: {
            subtotal: payload.pricing.subtotal,
            tax: payload.pricing.tax,
            total: payload.pricing.total,
            currency: payload.pricing.currency || "USD",
          },
          total: payload.pricing.total,
          petNames: bookingPayload.petNames
            .split(",")
            .map((name) => name.trim())
            .filter((name) => name.length > 0),
          email: bookingPayload.email,
        }),
      );

      setBookingId(nextBookingId);
      setClientSecret(nextClientSecret);
      onUpdate({
        bookingId: nextBookingId,
        clientSecret: nextClientSecret,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to initialize payment. Please try again.";
      setBookingError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [bookingPayload, onUpdate, pricingQuote]);

  useEffect(() => {
    if (bookingId || isLoading || hasAttemptedInit) {
      return;
    }

    setHasAttemptedInit(true);
    void initializeBookingAndPayment();
  }, [bookingId, hasAttemptedInit, isLoading, initializeBookingAndPayment]);

  if (!bookingId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>
            {isLoading ? "Preparing your booking..." : "Preparing secure checkout..."}
          </p>
          {bookingError ? (
            <p className="text-sm text-destructive">{bookingError}</p>
          ) : null}
          <Button onClick={initializeBookingAndPayment} disabled={isLoading}>
            Retry
          </Button>
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Booking Ready
          </CardTitle>
          <CardDescription>{BOOKING_PRICING_MODEL_LABEL}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your booking has been created. Payment processing is currently
            unavailable, and your reservation remains pending confirmation.
          </p>
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={finalizeBooking} disabled={!pricingDisclosureAccepted}>
              Complete Booking
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Payment Information
        </CardTitle>
        <CardDescription>
          {pricingQuote?.pricingModelLabel || BOOKING_PRICING_MODEL_LABEL}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total before confirmation</span>
              <span>${totalWithTax.toFixed(2)}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {pricingQuote?.disclosure || BOOKING_PRICING_DISCLOSURE}
          </p>
        </div>

        <div className="flex items-start space-x-3 rounded-lg border p-4">
          <Checkbox
            id="pricing-disclosure"
            checked={pricingDisclosureAccepted}
            onCheckedChange={(checked) => {
              const accepted = Boolean(checked);
              setPricingDisclosureAccepted(accepted);
              onUpdate({ pricingDisclosureAccepted: accepted });
            }}
          />
          <Label
            htmlFor="pricing-disclosure"
            className="cursor-pointer text-sm leading-relaxed"
          >
            I reviewed this pre-confirmation estimate and understand there are
            no hidden fees or surprise add-ons.
          </Label>
        </div>

        <Elements
          stripe={getStripe()}
          options={{
            clientSecret,
            appearance: { theme: "stripe" },
          }}
        >
          <PaymentForm
            onSuccess={finalizeBooking}
            onBack={onBack}
            disclosureAccepted={pricingDisclosureAccepted}
            totalWithTax={totalWithTax}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}
