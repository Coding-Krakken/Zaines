"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { AlertCircle, CreditCard, Loader2, Star } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStripe } from "@/lib/stripe-client";

type WalletPaymentMethod = {
  id: string;
  brand: string | null;
  expMonth: number | null;
  expYear: number | null;
  last4: string | null;
  isDefault: boolean;
};

type PaymentMethodsResponse = {
  customerId: string;
  paymentMethods: WalletPaymentMethod[];
};

function SetupIntentForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsSaving(true);
    setError(null);

    try {
      const { error: confirmError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/wallet`,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message || "Unable to save payment method.");
      } else {
        await onSaved();
      }
    } catch {
      setError("Unable to save payment method.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={!stripe || isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving Card...
          </>
        ) : (
          "Save Payment Method"
        )}
      </Button>
    </form>
  );
}

export function WalletManager() {
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<WalletPaymentMethod[]>([]);

  const fetchPaymentMethods = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/payment-methods");
      const payload = (await response.json()) as
        | PaymentMethodsResponse
        | { message?: string; error?: string };

      if (!response.ok || !("paymentMethods" in payload)) {
        const message =
          "message" in payload
            ? payload.message || payload.error || "Unable to load payment methods."
            : "Unable to load payment methods.";
        throw new Error(message);
      }

      setPaymentMethods(payload.paymentMethods);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payment methods.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSetupIntent = useCallback(async () => {
    setIsBootstrapping(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usage: "off_session" }),
      });
      const payload = (await response.json()) as {
        clientSecret?: string;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.clientSecret) {
        throw new Error(payload.message || payload.error || "Unable to initialize wallet setup.");
      }

      setSetupClientSecret(payload.clientSecret);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to initialize wallet setup.",
      );
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([fetchSetupIntent(), fetchPaymentMethods()]);
  }, [fetchPaymentMethods, fetchSetupIntent]);

  const sortedMethods = useMemo(() => {
    return [...paymentMethods].sort((left, right) => Number(right.isDefault) - Number(left.isDefault));
  }, [paymentMethods]);

  const setDefaultMethod = useCallback(async (paymentMethodId: string) => {
    setIsMutating(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/payment-methods/default", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId }),
      });

      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.message || payload.error || "Unable to set default payment method.");
      }

      await fetchPaymentMethods();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to set default payment method.",
      );
    } finally {
      setIsMutating(false);
    }
  }, [fetchPaymentMethods]);

  const removeMethod = useCallback(async (paymentMethodId: string) => {
    setIsMutating(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/payment-methods/${paymentMethodId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.message || payload.error || "Unable to remove payment method.");
      }

      await fetchPaymentMethods();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove payment method.",
      );
    } finally {
      setIsMutating(false);
    }
  }, [fetchPaymentMethods]);

  const handleSaved = useCallback(async () => {
    await fetchSetupIntent();
    await fetchPaymentMethods();
  }, [fetchPaymentMethods, fetchSetupIntent]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-xl border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add a Card
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isBootstrapping ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing secure card setup...
            </div>
          ) : setupClientSecret ? (
            <Elements stripe={getStripe()} options={{ clientSecret: setupClientSecret }}>
              <SetupIntentForm onSaved={handleSaved} />
            </Elements>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>
                Unable to initialize card setup right now.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border/70 bg-card/80">
        <CardHeader>
          <CardTitle>Saved Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading saved cards...
            </div>
          ) : sortedMethods.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved cards yet. Add your first card to enable one-click rebooking.
            </p>
          ) : (
            sortedMethods.map((method) => (
              <div key={method.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium uppercase">
                        {method.brand || "CARD"} •••• {method.last4 || "----"}
                      </p>
                      {method.isDefault ? (
                        <Badge variant="secondary" className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3" /> Default
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expires {method.expMonth || "--"}/{method.expYear || "----"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!method.isDefault ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="focus-ring"
                        onClick={() => {
                          void setDefaultMethod(method.id);
                        }}
                        disabled={isMutating}
                      >
                        Set Default
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      className="focus-ring"
                      onClick={() => {
                        void removeMethod(method.id);
                      }}
                      disabled={isMutating}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
