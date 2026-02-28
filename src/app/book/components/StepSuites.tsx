"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Home,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Tv,
  Camera,
} from "lucide-react";
import {
  stepSuitesSchema,
  type StepSuitesData,
} from "@/lib/validations/booking-wizard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StepSuitesProps {
  data: Partial<StepSuitesData>;
  onUpdate: (data: Partial<StepSuitesData>) => void;
  onNext: () => void;
  onBack: () => void;
  nights?: number; // From dates step for pricing calculation
}

// Suite tier options (hardcoded, can be moved to API later)
const SUITES = [
  {
    value: "standard" as const,
    label: "Standard Suite",
    pricePerNight: 65,
    size: "6x8 ft",
    amenities: ["Raised bed", "Daily feeding", "Twice daily walks"],
    icon: Home,
  },
  {
    value: "deluxe" as const,
    label: "Deluxe Suite",
    pricePerNight: 85,
    size: "8x10 ft",
    amenities: [
      "Raised bed",
      "TV with DogTV",
      "Webcam access",
      "Three daily walks",
    ],
    icon: Tv,
    badge: "Most Popular",
  },
  {
    value: "luxury" as const,
    label: "Luxury Suite",
    pricePerNight: 120,
    size: "10x12 ft",
    amenities: [
      "Private patio",
      "HD webcam",
      "Orthopedic bed",
      "24/7 monitoring",
      "Four daily walks",
    ],
    icon: Camera,
    badge: "Premium",
  },
];

// Add-on options
const ADD_ONS = [
  {
    id: "extra-walk",
    name: "Extra Walk",
    description: "Additional 15-minute walk",
    price: 10,
  },
  {
    id: "playtime",
    name: "Extended Playtime",
    description: "30 minutes of one-on-one playtime",
    price: 15,
  },
  {
    id: "comfort-care",
    name: "Comfort Care Package",
    description: "Extra bedding refresh and end-of-stay cleanup",
    price: 25,
  },
  {
    id: "nail-trim",
    name: "Nail Trim",
    description: "Professional nail trimming",
    price: 15,
  },
  {
    id: "medication",
    name: "Medication Administration",
    description: "Per medication, per day",
    price: 5,
  },
];

export function StepSuites({
  data,
  onUpdate,
  onNext,
  onBack,
  nights = 1,
}: StepSuitesProps) {
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(
    data.addOns?.map((a) => a.id) || [],
  );

  const handleSuiteSelect = (suiteValue: "standard" | "deluxe" | "luxury") => {
    onUpdate({ suiteType: suiteValue });
  };

  const handleAddOnToggle = (addOnId: string, checked: boolean) => {
    let newSelectedAddOns: string[];

    if (checked) {
      newSelectedAddOns = [...selectedAddOns, addOnId];
    } else {
      newSelectedAddOns = selectedAddOns.filter((id) => id !== addOnId);
    }

    setSelectedAddOns(newSelectedAddOns);

    // Update wizard data with add-on objects
    const addOnObjects = newSelectedAddOns.map((id) => ({
      id,
      quantity: 1, // Default quantity
    }));

    onUpdate({ addOns: addOnObjects });
  };

  const calculateTotal = () => {
    if (!data.suiteType) return 0;

    const suite = SUITES.find((s) => s.value === data.suiteType);
    if (!suite) return 0;

    const suiteTotal = suite.pricePerNight * nights;
    const addOnsTotal = selectedAddOns.reduce((sum, addOnId) => {
      const addOn = ADD_ONS.find((a) => a.id === addOnId);
      return sum + (addOn?.price || 0);
    }, 0);

    return suiteTotal + addOnsTotal;
  };

  const handleNext = () => {
    // Validate with Zod
    const validation = stepSuitesSchema.safeParse({
      suiteType: data.suiteType,
      addOns: data.addOns || [],
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      toast.error(firstError.message);
      return;
    }

    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Choose Your Suite
        </CardTitle>
        <CardDescription>
          Select the perfect accommodation for your pet
          {nights > 1 && ` (${nights} nights)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Suite Selection */}
        <div className="space-y-3">
          <Label>Suite Type *</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {SUITES.map((suite) => {
              const Icon = suite.icon;
              const isSelected = data.suiteType === suite.value;

              return (
                <button
                  key={suite.value}
                  onClick={() => handleSuiteSelect(suite.value)}
                  className={cn(
                    "relative flex flex-col rounded-lg border-2 p-4 text-left transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    isSelected ? "border-primary bg-primary/5" : "border-muted",
                  )}
                >
                  {/* Badge */}
                  {suite.badge && (
                    <Badge
                      className="absolute right-2 top-2 text-xs"
                      variant="secondary"
                    >
                      {suite.badge}
                    </Badge>
                  )}

                  {/* Icon */}
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {isSelected && (
                      <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
                    )}
                  </div>

                  {/* Title & Price */}
                  <div className="mb-2">
                    <div className="font-semibold">{suite.label}</div>
                    <div className="text-lg font-bold text-primary">
                      ${suite.pricePerNight}/night
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {suite.size}
                    </div>
                  </div>

                  {/* Amenities */}
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {suite.amenities.map((amenity, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="mt-0.5">•</span>
                        <span>{amenity}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Care Selection */}
        <div className="space-y-3">
          <Label>Optional Care Selections</Label>
          <p className="text-sm text-muted-foreground">
            Select only what you want added to your quote. No surprise add-ons
            are applied automatically.
          </p>
          <div className="space-y-2 rounded-lg border p-4">
            {ADD_ONS.map((addOn) => {
              const isChecked = selectedAddOns.includes(addOn.id);

              return (
                <div
                  key={addOn.id}
                  className="flex items-start space-x-3 rounded-md p-2 hover:bg-accent"
                >
                  <Checkbox
                    id={addOn.id}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleAddOnToggle(addOn.id, checked as boolean)
                    }
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={addOn.id}
                      className="flex items-center justify-between text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <span>{addOn.name}</span>
                      <span className="font-semibold text-primary">
                        ${addOn.price}
                      </span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {addOn.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Summary */}
        {data.suiteType && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Suite ({nights} {nights === 1 ? "night" : "nights"})
                </span>
                <span>
                  $
                  {(SUITES.find((s) => s.value === data.suiteType)
                    ?.pricePerNight || 0) * nights}
                </span>
              </div>

              {selectedAddOns.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Add-ons</span>
                  <span>
                    $
                    {selectedAddOns.reduce((sum, id) => {
                      const addOn = ADD_ONS.find((a) => a.id === id);
                      return sum + (addOn?.price || 0);
                    }, 0)}
                  </span>
                </div>
              )}

              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span className="text-lg text-primary">
                    ${calculateTotal()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Subtotal is shown now. Tax and final total are shown before
                  confirmation with no hidden fees or surprise add-ons.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!data.suiteType}>
            Continue to Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
