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
import { CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import {
  stepPaymentSchema,
  type StepPaymentData,
} from "@/lib/validations/booking-wizard";
import { getStripe } from "@/lib/stripe-client";
import { toast } from "sonner";

interface StepPaymentProps {
  data: Partial<StepPaymentData> & { clientSecret?: string };
  onUpdate: (
    data: Partial<StepPaymentData> & { clientSecret?: string },
  ) => void;
  onNext: () => void;
  onBack: () => void;
  totalAmount: number; // From previous steps
}

function PaymentForm({
  onSuccess,
  onBack,
}: {
  onSuccess: () => void;
  onBack: () => void;
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
        <Button type="submit" disabled={!stripe || isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay Now
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
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    const validation = stepPaymentSchema.safeParse({
      paymentOption: "full",
      amount: totalAmount,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    onUpdate({ paymentOption: "full", amount: totalAmount });
    onNext();
  };

  const initializePayment = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
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
        <CardDescription>
          Total Amount: ${totalAmount.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements
          stripe={getStripe()}
          options={{
            clientSecret,
            appearance: { theme: "stripe" },
          }}
        >
          <PaymentForm onSuccess={handleNext} onBack={onBack} />
        </Elements>
      </CardContent>
    </Card>
  );
}
