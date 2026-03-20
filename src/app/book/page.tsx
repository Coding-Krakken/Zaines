"use client";

import { StepDates } from "@/app/book/components/StepDates";
import { StepSuites } from "@/app/book/components/StepSuites";
import { StepAccount } from "@/app/book/components/StepAccount";
import { StepPets } from "@/app/book/components/StepPets";
import { StepWaiver } from "@/app/book/components/StepWaiver";
import { StepPayment } from "@/app/book/components/StepPayment";
import { useBookingWizard } from "@/hooks/useBookingWizard";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui/button";

// Helper function to calculate total booking amount
function calculateTotal(wizardData: {
  dates?: { checkIn?: string; checkOut?: string; petCount?: number };
  suites?: {
    suiteType?: string;
    addOns?: Array<{ id: string; quantity: number }>;
  };
}): number {
  const { dates, suites } = wizardData;

  if (!dates?.checkIn || !dates?.checkOut || !suites?.suiteType) {
    return 0;
  }

  // Calculate number of nights
  const checkIn = new Date(dates.checkIn);
  const checkOut = new Date(dates.checkOut);
  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Base prices per night per suite type
  const suitePrices: Record<string, number> = {
    standard: 45,
    deluxe: 75,
    luxury: 120,
  };

  const basePrice = suitePrices[suites.suiteType] || 45;
  const petCount = dates.petCount || 1;

  // Calculate add-ons cost
  const addOnsTotal = (suites.addOns || []).reduce(
    (total: number, addon: { id: string; quantity: number }) => {
      const addonPrices: Record<string, number> = {
        "extra-walk": 10,
        playtime: 15,
        "nail-trim": 15,
        medication: 5,
        "comfort-care": 25,
      };
      return total + (addonPrices[addon.id] || 0) * addon.quantity;
    },
    0,
  );

  return basePrice * nights * petCount + addOnsTotal;
}

export default function BookPage() {
  const { currentStep, wizardData, nextStep, prevStep, updateStepData } =
    useBookingWizard();

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
            Only 3 private suites, owner onsite, camera-monitored safety, no
            harsh chemicals, and premium but fair pricing with no hidden fees.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            You see a clear total before confirmation with no surprise add-ons.
            Total price is shown before confirmation with no hidden fees or
            surprise add-ons.
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
            <StepPayment
              data={wizardData.payment || {}}
              onUpdate={(data) => updateStepData("payment", data)}
              onNext={nextStep}
              onBack={prevStep}
              totalAmount={calculateTotal(wizardData)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
