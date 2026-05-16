/**
 * Enhanced Progress Stepper Component
 * 
 * Phase 5: Booking UX - Visual progress tracking with mobile optimization
 * 
 * Features:
 * - Larger touch targets for mobile (min 44x44px)
 * - Progress percentage visualization
 * - Completed step checkmarks
 * - Accessible ARIA labels
 */

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
}

interface EnhancedStepperProps {
  steps: Step[];
  currentStepIndex: number;
  className?: string;
}

export function EnhancedStepper({ steps, currentStepIndex, className }: EnhancedStepperProps) {
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bar */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Booking progress: ${Math.round(progressPercentage)}% complete`}
          />
        </div>
        <span className="text-sm font-semibold text-primary min-w-[3ch]">
          {Math.round(progressPercentage)}%
        </span>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isFuture = index > currentStepIndex;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center flex-1 relative"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 left-1/2 w-full h-0.5 -z-10",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}

              {/* Step Circle (Mobile-optimized touch target: 44x44px) */}
              <div
                className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300",
                  "min-w-[44px] min-h-[44px]", // WCAG AA touch target size
                  isCompleted &&
                    "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                  isCurrent &&
                    "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/20",
                  isFuture && "bg-muted text-muted-foreground"
                )}
                role="status"
                aria-label={
                  isCompleted
                    ? `${step.label}: Completed`
                    : isCurrent
                    ? `${step.label}: Current step`
                    : `${step.label}: Not started`
                }
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
                ) : (
                  <span className="text-sm md:text-base">{index + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  "mt-2 text-xs md:text-sm font-medium text-center transition-colors",
                  isCurrent ? "text-primary" : "text-muted-foreground",
                  "hidden sm:block" // Hide labels on mobile to save space
                )}
              >
                {step.label}
              </span>

              {/* Mobile: Show only current step label */}
              {isCurrent && (
                <span className="mt-2 text-xs font-semibold text-primary sm:hidden">
                  {step.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
