"use client";

import { useState, useEffect } from "react";
/* eslint-disable react/no-unescaped-entities */
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, PawPrint, Home, User, CheckCircle2, ArrowRight, ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";
import { StepDates } from "@/app/book/components/StepDates";
import { StepSuites } from "@/app/book/components/StepSuites";
import { StepAccount } from "@/app/book/components/StepAccount";
import { StepPets } from "@/app/book/components/StepPets";
import { StepWaiver } from "@/app/book/components/StepWaiver";
import { StepPayment } from "@/app/book/components/StepPayment";
import { useBookingWizard } from "@/hooks/useBookingWizard";
import { Stepper } from "@/components/Stepper";

type BookingStep = "dates" | "service" | "suite" | "contact" | "payment" | "confirmation";

// Helper function to calculate total booking amount
function calculateTotal(wizardData: any): number {
  const { dates, suites } = wizardData;
  
  if (!dates?.checkIn || !dates?.checkOut || !suites?.suiteType) {
    return 0;
  }
  
  // Calculate number of nights
  const checkIn = new Date(dates.checkIn);
  const checkOut = new Date(dates.checkOut);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  
  // Base prices per night per suite type
  const suitePrices: Record<string, number> = {
    standard: 45,
    deluxe: 75,
    luxury: 120,
  };
  
  const basePrice = suitePrices[suites.suiteType] || 45;
  const petCount = dates.petCount || 1;
  
  // Calculate add-ons cost
  const addOnsTotal = (suites.addOns || []).reduce((total: number, addon: any) => {
    const addonPrices: Record<string, number> = {
      'grooming': 35,
      'training': 50,
      'playtime': 15,
      'treats': 10,
    };
    return total + ((addonPrices[addon.id] || 0) * addon.quantity);
  }, 0);
  
  return (basePrice * nights * petCount) + addOnsTotal;
}

export default function BookPage() {
  const {
    currentStep,
    wizardData,
    progressPercentage,
    nextStep,
    prevStep,
    updateStepData,
  } = useBookingWizard();

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
            Just a few steps to reserve your pet's vacation
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mx-auto mb-8 max-w-4xl">
          <Stepper steps={steps} currentStep={steps.findIndex((s) => s.id === currentStep)} />
        </div>

        {/* Step Content */}
        <div className="mx-auto max-w-2xl">
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
