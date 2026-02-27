"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  completedSteps = [],
  className,
}: StepperProps) {
  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol role="list" className="flex items-center justify-between">
        {steps.map((step, stepIdx) => {
          const isCompleted =
            completedSteps.includes(stepIdx) || stepIdx < currentStep;
          const isCurrent = stepIdx === currentStep;
          const isUpcoming = stepIdx > currentStep;

          return (
            <li
              key={step.id}
              className={cn(
                "relative",
                stepIdx !== steps.length - 1 ? "flex-1" : "",
              )}
            >
              {/* Connector line */}
              {stepIdx !== steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-1/2 top-4 -z-10 h-0.5 w-full -translate-x-1/2",
                    isCompleted ? "bg-primary" : "bg-muted",
                  )}
                  aria-hidden="true"
                />
              )}

              <div className="group relative flex flex-col items-center">
                {/* Step circle */}
                <span
                  className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background text-primary",
                    isUpcoming &&
                      "border-muted bg-background text-muted-foreground",
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{stepIdx + 1}</span>
                  )}
                </span>

                {/* Step label */}
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isCurrent && "text-primary",
                    isUpcoming && "text-muted-foreground",
                    isCompleted && "text-foreground",
                  )}
                >
                  {step.label}
                </span>

                {/* Optional description */}
                {step.description && (
                  <span className="mt-1 hidden text-xs text-muted-foreground sm:block">
                    {step.description}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
