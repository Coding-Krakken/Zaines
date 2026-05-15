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
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* Connector line */}
              {stepIdx !== steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-1/2 top-4 -z-10 h-1 w-full -translate-x-1/2 rounded-full transition-all",
                    isCompleted ? "bg-[oklch(0.78_0.13_208)]" : "bg-[oklch(0.93_0.04_212)]",
                  )}
                  aria-hidden="true"
                />
              )}

              <div className="group relative flex flex-col items-center">
                {/* Step circle */}
                <span
                  className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all shadow-sm",
                    isCompleted &&
                      "border-[oklch(0.78_0.13_208)] bg-[oklch(0.78_0.13_208)] text-white shadow-[0_4px_12px_oklch(0.78_0.13_208/0.3)]",
                    isCurrent && "border-[oklch(0.78_0.13_208)] bg-white text-[oklch(0.78_0.13_208)] scale-110 shadow-[0_4px_16px_oklch(0.78_0.13_208/0.4)]",
                    isUpcoming &&
                      "border-[oklch(0.93_0.04_212)] bg-white text-[oklch(0.52_0.05_230)]",
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
                    "mt-2 text-xs font-semibold transition-colors",
                    isCurrent && "text-[oklch(0.78_0.13_208)]",
                    isUpcoming && "text-[oklch(0.52_0.05_230)]",
                    isCompleted && "text-[oklch(0.22_0.05_240)]",
                  )}
                >
                  {step.label}
                  <span className="sr-only">
                    {isCompleted ? " (completed)" : isCurrent ? " (current step)" : " (upcoming)"}
                  </span>
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
