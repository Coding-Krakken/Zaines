"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStripe } from "@/lib/stripe-client";

type SetupResponse = {
  paymentMode: "payment_element" | "embedded_checkout";
  clientSecret: string;
};

type Props = {
  bookingId: string;
  bookingNumber: string;
  total: number;
};

function PaymentElementRecoveryForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      setError("Payment form is still loading. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/book/confirmation?bookingId=${bookingId}`,
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message || "Unable to complete payment.");
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to complete payment.",
      );
      setIsSubmitting(false);
      return;
    }

    router.push(`/book/confirmation?bookingId=${bookingId}`);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitting || !stripe || !elements}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          "Complete Payment"
        )}
      </Button>
    </form>
  );
}

export default function RecoverPaymentClient({ bookingId, bookingNumber, total }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState<SetupResponse | null>(null);

  const loadRecoverySession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/setup-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId }),
      });

      const payload = (await response.json().catch(() => ({}))) as
        | SetupResponse
        | { error?: string; message?: string };

      if (!response.ok || !("clientSecret" in payload)) {
        throw new Error(
          ("error" in payload && payload.error) ||
            ("message" in payload && payload.message) ||
            "Unable to prepare payment recovery session.",
        );
      }

      setSetup(payload);
    } catch (setupError) {
      setSetup(null);
      setError(
        setupError instanceof Error
          ? setupError.message
          : "Unable to prepare payment recovery session.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRecoverySession();
  }, [loadRecoverySession]);

  const stripePromise = useMemo(() => getStripe(), []);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Recover Payment For Booking {bookingNumber}</CardTitle>
          <p className="text-sm text-muted-foreground">Amount due: ${total}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing your secure payment form...
            </div>
          ) : null}

          {!isLoading && error ? (
            <Alert variant="destructive">
              <AlertDescription>
                <div className="space-y-3">
                  <p>{error}</p>
                  <Button type="button" variant="outline" onClick={() => void loadRecoverySession()}>
                    Retry
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : null}

          {!isLoading && setup && setup.paymentMode === "embedded_checkout" ? (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{
                fetchClientSecret: async () => setup.clientSecret,
              }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : null}

          {!isLoading && setup && setup.paymentMode === "payment_element" ? (
            <Elements stripe={stripePromise} options={{ clientSecret: setup.clientSecret }}>
              <PaymentElementRecoveryForm bookingId={bookingId} />
            </Elements>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
