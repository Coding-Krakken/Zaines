"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { stepDatesSchema, type StepDatesData } from "@/lib/validations/booking-wizard";
import { toast } from "sonner";

interface StepDatesProps {
  data: Partial<StepDatesData>;
  onUpdate: (data: Partial<StepDatesData>) => void;
  onNext: () => void;
}

export function StepDates({ data, onUpdate, onNext }: StepDatesProps) {
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{
    available: boolean;
    nights: number;
    basePrice: number;
  } | null>(null);

  // Calculate nights when dates change
  const calculateNights = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  // Check availability when dates and service type are set
  useEffect(() => {
    if (data.checkIn && data.checkOut && data.serviceType) {
      checkAvailability();
    }
  }, [data.checkIn, data.checkOut, data.serviceType]);

  const checkAvailability = async () => {
    if (!data.checkIn || !data.checkOut || !data.serviceType) return;

    setIsCheckingAvailability(true);
    setAvailabilityResult(null);

    try {
      const response = await fetch(
        `http://localhost:3000/api/availability?checkIn=${data.checkIn}&checkOut=${data.checkOut}&serviceType=${data.serviceType}`
      );
      
      console.log('Fetching URL:', `/api/availability?checkIn=${data.checkIn}&checkOut=${data.checkOut}&serviceType=${data.serviceType}`);
      console.log('Request Headers:', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      console.log('API response:', result);

      if (result.available) {
        console.log('Suites are available!');
        const nights = calculateNights(data.checkIn, data.checkOut);
        setAvailabilityResult({
          available: true,
          nights,
          basePrice: result.basePrice || nights * 65, // Fallback to $65/night
        });
      } else {
        console.log('No suites available.');
        setAvailabilityResult({
          available: false,
          nights: 0,
          basePrice: 0,
        });
        toast.error("No availability for selected dates. Please choose different dates.");
      }
    } catch (error) {
      console.error('Error during availability check:', error);
      toast.error("Failed to check availability. Please try again.");
      setAvailabilityResult(null);
    } finally {
      setIsCheckingAvailability(false);
      console.log('Availability check completed.');
    }
  };

  const handleNext = () => {
    // Build complete step data
    const stepData: Partial<StepDatesData> = {
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      serviceType: data.serviceType,
      petCount: data.petCount || 1,
    };

    // Validate with Zod
    const validation = stepDatesSchema.safeParse(stepData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    // Check availability status
    if (!availabilityResult?.available) {
      toast.error("Please select dates with available suites");
      return;
    }

    // All valid, proceed to next step
    onNext();
  };

  const getTodayString = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0];
  };

  const minDate = getTodayString();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Select Your Dates & Service
        </CardTitle>
        <CardDescription>
          Choose your check-in and check-out dates, service type, and number of pets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Selection */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="checkIn">Check-in Date *</Label>
            <Input
              id="checkIn"
              type="date"
              min={minDate}
              value={data.checkIn || ""}
              onChange={(e) => onUpdate({ checkIn: e.target.value })}
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkOut">Check-out Date *</Label>
            <Input
              id="checkOut"
              type="date"
              min={data.checkIn || minDate}
              value={data.checkOut || ""}
              onChange={(e) => onUpdate({ checkOut: e.target.value })}
              required
              className="w-full"
            />
          </div>
        </div>

        {/* Service Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="serviceType">Service Type *</Label>
          <Select
            value={data.serviceType || ""}
            onValueChange={(value) => onUpdate({ serviceType: value as "boarding" | "daycare" })}
          >
            <SelectTrigger id="serviceType">
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boarding">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Overnight Boarding</span>
                  <span className="text-sm text-muted-foreground">$65-120/night</span>
                </div>
              </SelectItem>
              <SelectItem value="daycare">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Daycare</span>
                  <span className="text-sm text-muted-foreground">$45/day</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pet Count Selection */}
        <div className="space-y-2">
          <Label htmlFor="petCount">Number of Pets *</Label>
          <Select
            value={data.petCount?.toString() || "1"}
            onValueChange={(value) => onUpdate({ petCount: parseInt(value) })}
          >
            <SelectTrigger id="petCount">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "Pet" : "Pets"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Availability Check Status */}
        {isCheckingAvailability && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Checking availability...</AlertDescription>
          </Alert>
        )}

        {availabilityResult && !isCheckingAvailability && (
          <>
            {availabilityResult.available ? (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">Suites Available!</span>
                    <span className="text-sm">
                      {availabilityResult.nights} {availabilityResult.nights === 1 ? "night" : "nights"} 
                      {" • "}Starting from ${availabilityResult.basePrice.toFixed(2)}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No suites available for selected dates. Please choose different dates.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Next Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleNext}
            disabled={
              !data.checkIn ||
              !data.checkOut ||
              !data.serviceType ||
              !data.petCount ||
              isCheckingAvailability ||
              !availabilityResult?.available
            }
          >
            Continue to Suite Selection
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
