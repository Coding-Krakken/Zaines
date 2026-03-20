"use client";

import { useState } from "react";
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

interface StepPaymentProps {
  data: Partial<StepPaymentData> & {
    clientSecret?: string;
    pricingDisclosureAccepted?: boolean;
  };
  onUpdate: (
    data: Partial<StepPaymentData> & {
      clientSecret?: string;
      pricingDisclosureAccepted?: boolean;
    },
  ) => void;
  onNext: () => void;
  onBack: () => void;
  totalAmount: number; // From previous steps
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
}: StepPaymentProps) {
  const [clientSecret, setClientSecret] = useState(data.clientSecret || "");
  const [pricingDisclosureAccepted, setPricingDisclosureAccepted] = useState(
    Boolean(data.pricingDisclosureAccepted),
  );
  const [isLoading, setIsLoading] = useState(false);
  const subtotal = Math.round(totalAmount * 100) / 100;
  const tax = Math.round(subtotal * 0.1 * 100) / 100;
  const totalWithTax = Math.round((subtotal + tax) * 100) / 100;

  const handleNext = () => {
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
    });
    onNext();
  };

  const initializePayment = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalWithTax }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize payment");
      }

      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
      onUpdate({ clientSecret });
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast.error("Failed to initialize payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Initializing payment...</p>
          <Button onClick={initializePayment} disabled={isLoading}>
            Retry
          </Button>
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
        <CardDescription>{BOOKING_PRICING_MODEL_LABEL}</CardDescription>
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
            {BOOKING_PRICING_DISCLOSURE}
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
            onSuccess={handleNext}
            onBack={onBack}
            disclosureAccepted={pricingDisclosureAccepted}
            totalWithTax={totalWithTax}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}
