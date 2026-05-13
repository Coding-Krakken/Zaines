"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  stepDatesSchema,
  type StepDatesData,
} from "@/lib/validations/booking-wizard";
import { canDispatchAvailabilityCheck } from "@/lib/booking/availability-flow";
import {
  AvailabilityErrorResponse,
  AvailabilityState,
  AvailabilitySuccessResponse,
  calculateNights,
} from "@/app/book/components/step-dates-contract";
import { useSiteSettings } from "@/hooks/use-site-settings";

interface StepDatesProps {
  data: Partial<StepDatesData>;
  onUpdate: (data: Partial<StepDatesData>) => void;
  onNext: () => void;
  onCancel?: () => void;
}

export function StepDates({ data, onUpdate, onNext, onCancel }: StepDatesProps) {
  const { availabilityRules } = useSiteSettings();
  const minNights = Math.max(1, availabilityRules.minNightsPerBooking || 1);

  const [availabilityState, setAvailabilityState] =
    useState<AvailabilityState>("idle");
  const [availabilityResult, setAvailabilityResult] = useState<{
    available: boolean;
    nights: number;
    nextRetryAfterSeconds?: number;
    correlationId?: string;
  } | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<string>("");

  const checkAvailability = useCallback(async () => {
    if (
      !canDispatchAvailabilityCheck({
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        serviceType: data.serviceType,
      })
    ) {
      if (
        data.checkIn &&
        data.checkOut &&
        new Date(data.checkOut) <= new Date(data.checkIn)
      ) {
        setAvailabilityState("invalid_input");
        setAvailabilityResult(null);
        setAvailabilityMessage("Check-out must be after check-in.");
      }
      return;
    }

    const selectedNights = calculateNights(data.checkIn!, data.checkOut!);
    if (selectedNights < minNights) {
      setAvailabilityState("invalid_input");
      setAvailabilityResult(null);
      setAvailabilityMessage(
        `Minimum stay is ${minNights} night${minNights === 1 ? "" : "s"}.`,
      );
      return;
    }

    setAvailabilityState("validating_input");
    setAvailabilityResult(null);
    setAvailabilityMessage("");

    setAvailabilityState("checking_availability");

    try {
      const response = await fetch("/api/booking/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          serviceType: "boarding",
          partySize: Math.min(Math.max(data.petCount || 1, 1), 2),
        }),
      });

      const payload: AvailabilitySuccessResponse | AvailabilityErrorResponse =
        await response.json();

      if (response.ok && "isAvailable" in payload) {
        const nights = calculateNights(data.checkIn!, data.checkOut!);

        if (payload.isAvailable) {
          setAvailabilityState("available");
          setAvailabilityResult({ available: true, nights });
          setAvailabilityMessage("Suites available for your selected dates.");
          return;
        }

        setAvailabilityState("unavailable_recoverable");
        setAvailabilityResult({
          available: false,
          nights,
          nextRetryAfterSeconds: payload.nextRetryAfterSeconds,
        });
        setAvailabilityMessage(
          "Selected dates are currently unavailable. Please adjust dates or retry.",
        );
        return;
      }

      const errorPayload = payload as AvailabilityErrorResponse;
      if (errorPayload.errorCode === "INVALID_DATE_RANGE") {
        setAvailabilityState("invalid_input");
        setAvailabilityMessage("Check-out must be after check-in.");
      } else {
        setAvailabilityState("service_degraded");
        setAvailabilityResult({
          available: false,
          nights: calculateNights(data.checkIn!, data.checkOut!),
          correlationId: errorPayload.correlationId,
        });
        setAvailabilityMessage(
          "Availability is temporarily unavailable. Please retry.",
        );
      }
    } catch {
      setAvailabilityState("service_degraded");
      setAvailabilityResult(null);
      setAvailabilityMessage(
        "Availability is temporarily unavailable. Please retry.",
      );
    }
  }, [data.checkIn, data.checkOut, data.serviceType, data.petCount, minNights]);

  useEffect(() => {
    if (!data.petCount) {
      onUpdate({ petCount: 1 });
    }
  }, [data.petCount, onUpdate]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (data.checkIn && data.checkOut && data.serviceType) {
      timeoutId = setTimeout(() => {
        void checkAvailability();
      }, 0);
    } else {
      timeoutId = setTimeout(() => {
        setAvailabilityState("idle");
        setAvailabilityResult(null);
        setAvailabilityMessage("");
      }, 0);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [data.checkIn, data.checkOut, data.serviceType, checkAvailability]);

  const handleNext = () => {
    const stepData: Partial<StepDatesData> = {
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      serviceType: data.serviceType,
      petCount: data.petCount || 1,
    };

    const validation = stepDatesSchema.safeParse(stepData);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      setAvailabilityState("invalid_input");
      setAvailabilityMessage(firstError.message);
      return;
    }

    const selectedNights = calculateNights(data.checkIn!, data.checkOut!);
    if (selectedNights < minNights) {
      setAvailabilityState("invalid_input");
      setAvailabilityMessage(
        `Minimum stay is ${minNights} night${minNights === 1 ? "" : "s"}.`,
      );
      return;
    }

    if (availabilityState !== "available") {
      setAvailabilityMessage(
        "Please select dates with available suites before continuing.",
      );
      return;
    }

    onNext();
  };

  const getTodayString = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0];
  };

  const minDate = getTodayString();

  // Parse flexible date formats (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.)
  const parseDateInput = (input: string): string | null => {
    if (!input) return null;
    
    // Already in ISO format
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    
    // Try MM/DD/YYYY or M/D/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
      const parts = input.split('/');
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2];
      const dateStr = `${year}-${month}-${day}`;
      if (!isNaN(new Date(dateStr).getTime())) {
        return dateStr;
      }
    }
    
    return null;
  };

  const handleDateInput = (rawInput: string, setter: (value: string) => void) => {
    // If input looks complete, try to parse it
    if (rawInput.length >= 8) {
      const parsed = parseDateInput(rawInput);
      if (parsed) {
        setter(parsed);
        return;
      }
    }
    // Keep the input as-is for user correction
    // Parser will validate on blur
  };

  const handleDateBlur = (input: string, setter: (value: string) => void) => {
    const parsed = parseDateInput(input);
    if (parsed) {
      setter(parsed);
    } else if (input.trim()) {
      // Input was invalid, clear it and show message
      setAvailabilityState('invalid_input');
      setAvailabilityMessage('Please enter date in MM/DD/YYYY or YYYY-MM-DD format');
      setter('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Select Your Dates & Service
        </CardTitle>
        <CardDescription>
          Choose your check-in/check-out dates and number of pets for private
          boarding. Use calendar picker or enter dates as MM/DD/YYYY
        </CardDescription>
        <p className="text-sm text-muted-foreground">
          Minimum stay: {minNights} night{minNights === 1 ? "" : "s"}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="checkIn">Check-in Date *</Label>
            <Input
              id="checkIn"
              type="date"
              min={minDate}
              placeholder="MM/DD/YYYY or click calendar"
              value={data.checkIn || ""}
              onChange={(e) => handleDateInput(e.target.value, (v) => onUpdate({ checkIn: v }))}
              onBlur={(e) => handleDateBlur(e.target.value, (v) => onUpdate({ checkIn: v }))}
              required
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Format: MM/DD/YYYY or click the calendar icon</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkOut">Check-out Date *</Label>
            <Input
              id="checkOut"
              type="date"
              min={data.checkIn || minDate}
              placeholder="MM/DD/YYYY or click calendar"
              value={data.checkOut || ""}
              onChange={(e) => handleDateInput(e.target.value, (v) => onUpdate({ checkOut: v }))}
              onBlur={(e) => handleDateBlur(e.target.value, (v) => onUpdate({ checkOut: v }))}
              required
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Format: MM/DD/YYYY or click the calendar icon</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceType">Service Type *</Label>
          <Select
            value={data.serviceType || ""}
            onValueChange={(value) =>
              onUpdate({ serviceType: value as "boarding" })
            }
          >
            <SelectTrigger id="serviceType">
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boarding">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Overnight Boarding</span>
                  <span className="text-sm text-muted-foreground">
                    $65-120/night
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label id="petCountLabel" htmlFor="petCount">
            Number of Pets *
          </Label>
          <Select
            value={data.petCount?.toString() || "1"}
            onValueChange={(value) => onUpdate({ petCount: parseInt(value) })}
          >
            <SelectTrigger
              id="petCount"
              aria-labelledby="petCountLabel"
              aria-label="Number of Pets"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "Pet" : "Pets"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {availabilityState === "checking_availability" && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Checking availability...</AlertDescription>
          </Alert>
        )}

        {(availabilityState === "available" ||
          availabilityState === "unavailable_recoverable") &&
          availabilityResult && (
            <>
              {availabilityResult.available ? (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">Suites Available!</span>
                      <span className="text-sm">
                        {availabilityResult.nights}{" "}
                        {availabilityResult.nights === 1 ? "night" : "nights"}
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{availabilityMessage}</AlertDescription>
                </Alert>
              )}
            </>
          )}

        {(availabilityState === "invalid_input" ||
          availabilityState === "service_degraded") && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex flex-col gap-2">
                <span>{availabilityMessage}</span>
                {availabilityState === "service_degraded" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={checkAvailability}
                  >
                    Retry Availability Check
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between">
          {onCancel && (
            <Button variant="destructive" onClick={onCancel}>
              Cancel Booking
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={
              !data.checkIn ||
              !data.checkOut ||
              !data.serviceType ||
              !data.petCount ||
              availabilityState === "checking_availability" ||
              availabilityState !== "available"
            }
            className={!onCancel ? "ml-auto" : ""}
          >
            Continue to Suite Selection
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
