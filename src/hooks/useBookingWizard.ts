"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  StepDatesData,
  StepSuitesData,
  StepAccountData,
  StepPetsData,
  StepWaiverData,
  StepPaymentData,
} from "@/lib/validations/booking-wizard";
import {
  stepAccountSchema,
  stepDatesSchema,
  stepPetsSchema,
  stepSuitesSchema,
  stepWaiverSchema,
} from "@/lib/validations/booking-wizard";
import { typedStorage } from "@/lib/safe-storage";

export type BookingStep =
  | "dates"
  | "suites"
  | "account"
  | "pets"
  | "waiver"
  | "payment";

interface BookingWizardData {
  dates?: StepDatesData;
  suites?: StepSuitesData;
  account?: StepAccountData;
  pets?: StepPetsData;
  waiver?: StepWaiverData;
  payment?: StepPaymentData & {
    bookingId?: string;
    clientSecret?: string;
    paymentMode?: "payment_element" | "embedded_checkout";
    pricingDisclosureAccepted?: boolean;
  };
}

const STEPS: BookingStep[] = [
  "dates",
  "suites",
  "account",
  "pets",
  "waiver",
  "payment",
];
const STORAGE_KEY = "booking-wizard-progress";

const STEP_VALIDATORS = {
  dates: stepDatesSchema,
  suites: stepSuitesSchema,
  account: stepAccountSchema,
  pets: stepPetsSchema,
  waiver: stepWaiverSchema,
};

function isBookingStep(value: unknown): value is BookingStep {
  return typeof value === "string" && STEPS.includes(value as BookingStep);
}

function isStepDataComplete(
  wizardData: BookingWizardData,
  step: keyof typeof STEP_VALIDATORS,
): boolean {
  const stepData = wizardData[step];

  return Boolean(stepData && STEP_VALIDATORS[step].safeParse(stepData).success);
}

export function getRestoredWizardStep(
  wizardData: BookingWizardData,
  requestedStep: BookingStep,
): BookingStep {
  const requestedIndex = STEPS.indexOf(requestedStep);

  for (let index = 0; index < requestedIndex; index += 1) {
    const prerequisiteStep = STEPS[index];

    if (
      prerequisiteStep !== "payment" &&
      !isStepDataComplete(
        wizardData,
        prerequisiteStep as keyof typeof STEP_VALIDATORS,
      )
    ) {
      return prerequisiteStep;
    }
  }

  return requestedStep;
}

/**
 * Custom hook for managing booking wizard state
 * Handles step navigation, data persistence, and validation
 */
export function useBookingWizard() {
  const [currentStep, setCurrentStep] = useState<BookingStep>("dates");
  const [wizardData, setWizardData] = useState<BookingWizardData>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load saved progress from localStorage on mount
  useEffect(() => {
    const loadAndApplySavedProgress = () => {
      try {
        const parsed = typedStorage.getJson<{
          data: BookingWizardData;
          currentStep: string;
        }>(STORAGE_KEY);

        if (parsed) {
          const requestedStep = isBookingStep(parsed.currentStep)
            ? parsed.currentStep
            : "dates";
          const progressData = {
            data: parsed.data || {},
            step: requestedStep,
          };
          setWizardData(progressData.data);
          setCurrentStep(
            getRestoredWizardStep(progressData.data, progressData.step),
          );
        }
      } catch (error) {
        // Safe storage utilities silently handle all errors,
        // but log unexpected failures for debugging
        if (error instanceof Error && error.message !== 'Storage access blocked') {
          console.error("Failed to load saved progress:", error);
        }
      }
    };

    loadAndApplySavedProgress();
  }, []);

  // Persist to localStorage AFTER React paints, never during event handlers.
  // We skip the very first effect run (initial mount) so we don't overwrite
  // saved data with the empty default state before the load effect has run.
  const isFirstPersistRun = useRef(true);

  useEffect(() => {
    if (isFirstPersistRun.current) {
      isFirstPersistRun.current = false;
      return;
    }
    const success = typedStorage.setJson(STORAGE_KEY, {
      data: wizardData,
      currentStep,
      savedAt: new Date().toISOString(),
    });
    if (!success && process.env.NODE_ENV === "development") {
      console.debug("Booking wizard progress saved to memory (storage unavailable)");
    }
  }, [wizardData, currentStep]);

  // Update step data — no side effects in the state setter
  const updateStepData = useCallback(
    (
      step: BookingStep,
      data: Partial<BookingWizardData[keyof BookingWizardData]>,
    ) => {
      setWizardData((prev) => ({
        ...prev,
        [step]: { ...prev[step as keyof BookingWizardData], ...data },
      }));
    },
    [],
  );

  // Navigate to next step
  const nextStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  }, [currentStep]);

  // Navigate to previous step
  const prevStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  }, [currentStep]);

  // Go to specific step
  const goToStep = useCallback(
    (step: BookingStep) => {
      setCurrentStep(step);
    },
    [],
  );

  // Clear all data and start over
  const resetWizard = useCallback(() => {
    setWizardData({});
    setCurrentStep("dates");
    typedStorage.removeJson(STORAGE_KEY);
  }, []);

  // Get current step index (for progress indicator)
  const currentStepIndex = STEPS.indexOf(currentStep);
  const totalSteps = STEPS.length;
  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100;

  // Check if step is completed (has data)
  const isStepCompleted = useCallback(
    (step: BookingStep) => {
      return !!wizardData[step as keyof BookingWizardData];
    },
    [wizardData],
  );

  // Can navigate to next step?
  const canGoNext = currentStepIndex < STEPS.length - 1;

  // Can navigate to previous step?
  const canGoBack = currentStepIndex > 0;

  return {
    // Current state
    currentStep,
    currentStepIndex,
    totalSteps,
    progressPercentage,
    wizardData,
    isLoading,
    setIsLoading,

    // Navigation
    nextStep,
    prevStep,
    goToStep,
    canGoNext,
    canGoBack,

    // Data management
    updateStepData,
    resetWizard,
    isStepCompleted,

    // Steps array (for rendering step list)
    steps: STEPS,
  };
}
