"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CheckCircle2, Calculator } from "lucide-react";

const services = {
  boarding: {
    standard: 65,
    deluxe: 85,
    luxury: 120,
  },
  daycare: {
    single: 45,
    weekly: 200,
    monthly: 600,
  },
  grooming: {
    small: 45,
    medium: 65,
    large: 85,
    xlarge: 105,
  },
};

const addOns = [
  { name: "Extra Playtime (30 min)", price: 15 },
  { name: "Private Walk", price: 20 },
  { name: "Photo Package (10 photos)", price: 25 },
  { name: "Spa Treatment", price: 35 },
  { name: "Birthday Party Package", price: 75 },
  { name: "Training Session (30 min)", price: 50 },
];

export default function PricingPage() {
  const [serviceType, setServiceType] = useState<"boarding" | "daycare" | "grooming">("boarding");
  const [suiteType, setSuiteType] = useState<"standard" | "deluxe" | "luxury">("deluxe");
  const [nights, setNights] = useState([3]);
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);

  const calculateTotal = () => {
    let total = 0;
    
    if (serviceType === "boarding") {
      total = services.boarding[suiteType] * nights[0];
    } else if (serviceType === "daycare") {
      total = services.daycare.single * nights[0]; // Using nights as days for daycare
    } else if (serviceType === "grooming") {
      total = services.grooming.medium; // Default to medium
    }

    // Add selected add-ons
    selectedAddOns.forEach((index) => {
      total += addOns[index].price;
    });

    return total;
  };

  const toggleAddOn = (index: number) => {
    if (selectedAddOns.includes(index)) {
      setSelectedAddOns(selectedAddOns.filter((i) => i !== index));
    } else {
      setSelectedAddOns([...selectedAddOns, index]);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-50 to-blue-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Transparent Pricing</Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Pricing Calculator
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              No hidden fees. No surprises. Just honest, upfront pricing for premium pet care.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Calculator */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calculator className="h-6 w-6" />
                  <CardTitle className="text-2xl">Calculate Your Stay</CardTitle>
                </div>
                <CardDescription>
                  Customize your services to see the total cost
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Service Type */}
                <div className="space-y-2">
                  <Label htmlFor="service-type" className="text-base font-semibold">
                    Select Service
                  </Label>
                  <Select value={serviceType} onValueChange={(value) => setServiceType(value as "boarding" | "daycare" | "grooming")}>
                    <SelectTrigger id="service-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boarding">Dog Boarding</SelectItem>
                      <SelectItem value="daycare">Daycare</SelectItem>
                      <SelectItem value="grooming">Grooming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Suite Type (for boarding) */}
                {serviceType === "boarding" && (
                  <div className="space-y-2">
                    <Label htmlFor="suite-type" className="text-base font-semibold">
                      Suite Type
                    </Label>
                    <Select value={suiteType} onValueChange={(value) => setSuiteType(value as "standard" | "deluxe" | "luxury")}>
                      <SelectTrigger id="suite-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Suite - $65/night</SelectItem>
                        <SelectItem value="deluxe">Deluxe Suite - $85/night</SelectItem>
                        <SelectItem value="luxury">Luxury Suite - $120/night</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Number of Nights/Days */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      {serviceType === "boarding" ? "Number of Nights" : "Number of Days"}
                    </Label>
                    <Badge variant="secondary">{nights[0]}</Badge>
                  </div>
                  <Slider
                    value={nights}
                    onValueChange={setNights}
                    min={1}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Add-Ons */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Add-On Services</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {addOns.map((addOn, index) => (
                      <div
                        key={addOn.name}
                        onClick={() => toggleAddOn(index)}
                        className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                          selectedAddOns.includes(index)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{addOn.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ${addOn.price}
                            </div>
                          </div>
                          {selectedAddOns.includes(index) && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="rounded-lg bg-primary/10 p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-lg font-medium">Estimated Total</span>
                    <span className="text-3xl font-bold">${calculateTotal()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Final price may vary based on your pet&apos;s specific needs
                  </p>
                </div>

                <Button size="lg" className="w-full" asChild>
                  <Link href="/book">Book Your Stay</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Price List */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Complete Price List</h2>
            <p className="text-lg text-muted-foreground">
              All our services at a glance
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {/* Boarding Prices */}
            <Card>
              <CardHeader>
                <CardTitle>Boarding</CardTitle>
                <CardDescription>Per night pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Standard Suite</span>
                  <span className="font-semibold">$65</span>
                </div>
                <div className="flex justify-between">
                  <span>Deluxe Suite</span>
                  <span className="font-semibold">$85</span>
                </div>
                <div className="flex justify-between">
                  <span>Luxury Suite</span>
                  <span className="font-semibold">$120</span>
                </div>
                <div className="pt-2 text-sm text-muted-foreground">
                  10% discount for stays over 14 nights
                </div>
              </CardContent>
            </Card>

            {/* Daycare Prices */}
            <Card>
              <CardHeader>
                <CardTitle>Daycare</CardTitle>
                <CardDescription>Package pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Single Day</span>
                  <span className="font-semibold">$45</span>
                </div>
                <div className="flex justify-between">
                  <span>5-Day Pack</span>
                  <span className="font-semibold">$200</span>
                </div>
                <div className="flex justify-between">
                  <span>20-Day Pack</span>
                  <span className="font-semibold">$600</span>
                </div>
                <div className="pt-2 text-sm text-muted-foreground">
                  Packages valid for 3 months
                </div>
              </CardContent>
            </Card>

            {/* Grooming Prices */}
            <Card>
              <CardHeader>
                <CardTitle>Grooming</CardTitle>
                <CardDescription>By dog size</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Small (&lt;25 lbs)</span>
                  <span className="font-semibold">$45+</span>
                </div>
                <div className="flex justify-between">
                  <span>Medium (26-50 lbs)</span>
                  <span className="font-semibold">$65+</span>
                </div>
                <div className="flex justify-between">
                  <span>Large (51-80 lbs)</span>
                  <span className="font-semibold">$85+</span>
                </div>
                <div className="flex justify-between">
                  <span>X-Large (80+ lbs)</span>
                  <span className="font-semibold">$105+</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              All prices subject to change. Special discounts available for multi-pet families and extended stays.
            </p>
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-3xl font-bold">Pricing Policies</h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold">Payment</h3>
                <p className="text-muted-foreground">
                  Payment is required at booking. We accept all major credit cards, debit cards, and digital wallets.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">Cancellation</h3>
                <p className="text-muted-foreground">
                  Free cancellation up to 48 hours before check-in. Cancellations within 48 hours are subject to a 50% charge.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">Holiday Rates</h3>
                <p className="text-muted-foreground">
                  A 20% surcharge applies to major holidays (Thanksgiving, Christmas, New Year&apos;s). Early booking recommended.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">Multiple Pets</h3>
                <p className="text-muted-foreground">
                  Second pet receives 15% discount. Third and additional pets receive 20% discount when staying in the same suite.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Questions About Pricing?</h2>
          <p className="mb-8 text-lg opacity-90">
            Our team is happy to help you find the best package for your needs and budget
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link href="/book">Book Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
