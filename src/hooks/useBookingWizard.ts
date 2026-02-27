"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  StepDatesData,
  StepSuitesData,
  StepAccountData,
  StepPetsData,
  StepWaiverData,
  StepPaymentData,
} from "@/lib/validations/booking-wizard";

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
  payment?: StepPaymentData;
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
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const progressData = {
            data: parsed.data || {},
            step: parsed.currentStep || ("dates" as BookingStep),
          };
          setWizardData(progressData.data);
          setCurrentStep(progressData.step);
        }
      } catch (error) {
        console.error("Failed to load saved progress:", error);
      }
    };

    loadAndApplySavedProgress();
  }, []);

  // Save progress to localStorage whenever data changes
  const saveProgress = useCallback(
    (data: BookingWizardData, step: BookingStep) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            data,
            currentStep: step,
            savedAt: new Date().toISOString(),
          }),
        );
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
    },
    [],
  );

  // Update step data
  const updateStepData = useCallback(
    (
      step: BookingStep,
      data: Partial<BookingWizardData[keyof BookingWizardData]>,
    ) => {
      setWizardData((prev) => {
        const updated = {
          ...prev,
          [step]: { ...prev[step as keyof BookingWizardData], ...data },
        };
        saveProgress(updated, currentStep);
        return updated;
      });
    },
    [currentStep, saveProgress],
  );

  // Navigate to next step
  const nextStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentIndex + 1];
      setCurrentStep(nextStep);
      saveProgress(wizardData, nextStep);
    }
  }, [currentStep, wizardData, saveProgress]);

  // Navigate to previous step
  const prevStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStep = STEPS[currentIndex - 1];
      setCurrentStep(prevStep);
      saveProgress(wizardData, prevStep);
    }
  }, [currentStep, wizardData, saveProgress]);

  // Go to specific step
  const goToStep = useCallback(
    (step: BookingStep) => {
      setCurrentStep(step);
      saveProgress(wizardData, step);
    },
    [wizardData, saveProgress],
  );

  // Clear all data and start over
  const resetWizard = useCallback(() => {
    setWizardData({});
    setCurrentStep("dates");
    localStorage.removeItem(STORAGE_KEY);
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
