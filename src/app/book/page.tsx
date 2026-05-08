"use client";

import { useEffect, useMemo, useState } from "react";
import { StepDates } from "@/app/book/components/StepDates";
import { StepSuites } from "@/app/book/components/StepSuites";
import { StepAccount } from "@/app/book/components/StepAccount";
import { StepPets } from "@/app/book/components/StepPets";
import { StepWaiver } from "@/app/book/components/StepWaiver";
import { StepPayment } from "@/app/book/components/StepPayment";
import { useBookingWizard } from "@/hooks/useBookingWizard";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useSiteSettings } from "@/hooks/use-site-settings";

type BookingValidationPricing = {
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  pricingModelLabel: string;
  disclosure: string;
};

type BookingValidationResponse = {
  valid: boolean;
  pricing: BookingValidationPricing;
};

export default function BookPage() {
  const { trustCopy } = useSiteSettings();
  const { currentStep, wizardData, nextStep, prevStep, updateStepData } =
    useBookingWizard();
  const [pricingQuote, setPricingQuote] =
    useState<BookingValidationPricing | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteRetryNonce, setQuoteRetryNonce] = useState(0);

  const hasQuoteInputs = useMemo(() => {
    return Boolean(
      wizardData.dates?.checkIn &&
        wizardData.dates?.checkOut &&
        wizardData.suites?.suiteType &&
        wizardData.dates?.petCount,
    );
  }, [
    wizardData.dates?.checkIn,
    wizardData.dates?.checkOut,
    wizardData.suites?.suiteType,
    wizardData.dates?.petCount,
  ]);

  const visiblePricingQuote = hasQuoteInputs ? pricingQuote : null;
  const visibleQuoteError = hasQuoteInputs ? quoteError : null;

  const nights = useMemo(() => {
    const checkIn = wizardData.dates?.checkIn;
    const checkOut = wizardData.dates?.checkOut;

    if (!checkIn || !checkOut) {
      return 1;
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Math.max(1, diffDays);
  }, [wizardData.dates?.checkIn, wizardData.dates?.checkOut]);

  const bookingPayload = useMemo(() => {
    const checkIn = wizardData.dates?.checkIn;
    const checkOut = wizardData.dates?.checkOut;
    const petCount = wizardData.dates?.petCount;
    const suiteType = wizardData.suites?.suiteType;

    if (!checkIn || !checkOut || !petCount || !suiteType) {
      return null;
    }

    const selectedPetCount =
      (wizardData.pets?.selectedPetIds?.length || 0) +
      (wizardData.pets?.newPets?.length || 0);
    const petNames =
      wizardData.pets?.newPets?.map((pet) => pet.name).join(", ") ||
      `${Math.max(selectedPetCount, petCount)} pet(s)`;

    return {
      checkIn,
      checkOut,
      suiteType,
      petCount,
      firstName: wizardData.account?.firstName || "Guest",
      lastName: wizardData.account?.lastName || "Customer",
      email: wizardData.account?.email || "guest@example.com",
      phone: wizardData.account?.phone || "0000000000",
      petNames,
      specialRequests: "",
      addOns: wizardData.suites?.addOns || [],
      newPets: wizardData.pets?.newPets || [],
      vaccines: wizardData.pets?.vaccines || [],
      waiver: {
        liabilityAccepted: Boolean(wizardData.waiver?.liabilityAccepted),
        medicalAuthorizationAccepted: Boolean(
          wizardData.waiver?.medicalAuthorizationAccepted,
        ),
        photoReleaseAccepted: Boolean(wizardData.waiver?.photoReleaseAccepted),
        policyAcknowledgmentAccepted: Boolean(
          wizardData.waiver?.policyAcknowledgmentAccepted,
        ),
        signature: wizardData.waiver?.signature || "pending-signature",
      },
    };
  }, [wizardData]);

  useEffect(() => {
    const checkIn = wizardData.dates?.checkIn;
    const checkOut = wizardData.dates?.checkOut;
    const suiteType = wizardData.suites?.suiteType;
    const petCount = wizardData.dates?.petCount;

    if (!checkIn || !checkOut || !suiteType || !petCount) {
      return;
    }

    let isCancelled = false;

    const validatePricing = async () => {
      setQuoteError(null);
      setIsQuoteLoading(true);

      try {
        const response = await fetch("/api/bookings/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            checkIn,
            checkOut,
            suiteType,
            petCount,
          }),
        });

        const payload = (await response.json()) as
          | BookingValidationResponse
          | { message?: string };

        if (!response.ok || !("pricing" in payload)) {
          throw new Error(
            "message" in payload && payload.message
              ? payload.message
              : "Unable to validate pricing right now.",
          );
        }

        if (!isCancelled) {
          setPricingQuote(payload.pricing);
        }
      } catch (error) {
        if (!isCancelled) {
          setPricingQuote(null);
          setQuoteError(
            error instanceof Error
              ? error.message
              : "Unable to validate pricing right now.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsQuoteLoading(false);
        }
      }
    };

    void validatePricing();

    return () => {
      isCancelled = true;
    };
  }, [
    wizardData.dates?.checkIn,
    wizardData.dates?.checkOut,
    wizardData.dates?.petCount,
    wizardData.suites?.suiteType,
    quoteRetryNonce,
  ]);

  const steps = [
    { id: "dates", label: "Dates" },
    { id: "suites", label: "Suites" },
    { id: "account", label: "Account" },
    { id: "pets", label: "Pets" },
    { id: "waiver", label: "Waiver" },
    { id: "payment", label: "Payment" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold">Book Your Stay</h1>
          <p className="text-lg text-muted-foreground">
            Just a few steps to reserve your pet&apos;s vacation
          </p>
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <a href="#booking-wizard">Start Booking</a>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {trustCopy.trustEvidenceClaim}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {trustCopy.pricingDisclosure}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mx-auto mb-8 max-w-4xl">
          <Stepper
            steps={steps}
            currentStep={steps.findIndex((s) => s.id === currentStep)}
          />
        </div>

        {/* Step Content */}
        <div id="booking-wizard" className="mx-auto max-w-2xl">
          {currentStep === "dates" && (
            <StepDates
              data={wizardData.dates || {}}
              onUpdate={(data) => updateStepData("dates", data)}
              onNext={nextStep}
            />
          )}

          {currentStep === "suites" && (
            <StepSuites
              data={wizardData.suites || {}}
              onUpdate={(data) => updateStepData("suites", data)}
              onNext={nextStep}
              onBack={prevStep}
              nights={nights}
            />
          )}

          {currentStep === "account" && (
            <StepAccount
              data={wizardData.account || {}}
              onUpdate={(data) => updateStepData("account", data)}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === "pets" && (
            <StepPets
              data={wizardData.pets || {}}
              onUpdate={(data) => updateStepData("pets", data)}
              onNext={nextStep}
              onBack={prevStep}
              petCount={wizardData.dates?.petCount || 1}
            />
          )}

          {currentStep === "waiver" && (
            <StepWaiver
              data={wizardData.waiver || {}}
              onUpdate={(data) => updateStepData("waiver", data)}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === "payment" && (
            <>
              {isQuoteLoading ? (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Validating your final pricing before payment...
                  </AlertDescription>
                </Alert>
              ) : null}

              {visibleQuoteError ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>
                    <div className="flex flex-col gap-2">
                      <span>{visibleQuoteError}</span>
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setQuoteRetryNonce(
                              (currentValue) => currentValue + 1,
                            )
                          }
                        >
                          Retry pricing validation
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}

              <StepPayment
                data={wizardData.payment || {}}
                onUpdate={(data) => updateStepData("payment", data)}
                onNext={nextStep}
                onBack={prevStep}
                totalAmount={visiblePricingQuote?.total || 0}
                pricingQuote={visiblePricingQuote}
                bookingPayload={bookingPayload}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
