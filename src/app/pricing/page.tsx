"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CheckCircle2, Calculator } from "lucide-react";

const services = {
  boarding: {
    standard: 65,
    deluxe: 85,
    luxury: 120,
  },
};

const addOns = [
  { name: "Extra Playtime (30 min)", price: 15 },
  { name: "Private Walk", price: 20 },
  { name: "Photo Package (10 photos)", price: 25 },
  { name: "Spa Treatment", price: 35 },
  { name: "Birthday Party Package", price: 75 },
  { name: "Comfort Care Package", price: 50 },
];

export default function PricingPage() {
  const [serviceType] = useState<"boarding">("boarding");
  const [suiteType, setSuiteType] = useState<"standard" | "deluxe" | "luxury">(
    "deluxe",
  );
  const [nights, setNights] = useState([3]);
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);

  const calculateTotal = () => {
    let total = services.boarding[suiteType] * nights[0];

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
              Private Boarding Pricing
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Premium but fair suite rates with clear pricing before
              confirmation, no hidden fees, and no surprise add-ons.
            </p>
            <p className="mb-6 text-sm text-muted-foreground md:text-base">
              Only 3 private suites, owner onsite, camera-monitored safety, no
              harsh chemicals, and premium but fair pricing with no hidden fees.
            </p>
            <div className="mb-4 md:hidden">
              <Button size="lg" className="w-full" asChild>
                <Link href="/book">Book Your Stay</Link>
              </Button>
            </div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/book">Book Your Stay</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Talk With Our Team</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Rates below are planning ranges while package selection remains in
              progress; you see a clear total before confirmation with no hidden
              fees, no surprise add-ons, and a premium but fair pricing model.
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
                  <CardTitle className="text-2xl">
                    Calculate Your Stay
                  </CardTitle>
                </div>
                <CardDescription>
                  Customize your selections to see a planning estimate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Service Type */}
                <div className="space-y-2">
                  <Label
                    htmlFor="service-type"
                    id="service-type-label"
                    className="text-base font-semibold"
                  >
                    Select Service
                  </Label>
                  <Select value={serviceType} disabled>
                    <SelectTrigger
                      id="service-type"
                      aria-labelledby="service-type-label"
                      aria-label="Select Service"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boarding">Private Boarding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Suite Type (for boarding) */}
                {serviceType === "boarding" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="suite-type"
                      id="suite-type-label"
                      className="text-base font-semibold"
                    >
                      Suite Type
                    </Label>
                    <Select
                      value={suiteType}
                      onValueChange={(value) =>
                        setSuiteType(value as "standard" | "deluxe" | "luxury")
                      }
                    >
                      <SelectTrigger
                        id="suite-type"
                        aria-labelledby="suite-type-label"
                        aria-label="Suite Type"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">
                          Standard Suite - $65/night
                        </SelectItem>
                        <SelectItem value="deluxe">
                          Deluxe Suite - $85/night
                        </SelectItem>
                        <SelectItem value="luxury">
                          Luxury Suite - $120/night
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Number of Nights/Days */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      Number of Nights
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
                  <Label className="text-base font-semibold">
                    Optional Care Selections
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Optional selections are only included when you choose them;
                    nothing is auto-added.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {addOns.map((addOn, index) => (
                      <button
                        type="button"
                        key={addOn.name}
                        onClick={() => toggleAddOn(index)}
                        aria-pressed={selectedAddOns.includes(index)}
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
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="rounded-lg bg-primary/10 p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-lg font-medium">Estimated Total</span>
                    <span className="text-3xl font-bold">
                      ${calculateTotal()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This is a pre-confirmation estimate with premium but fair
                    pricing. Final subtotal, tax, and total are shown before you
                    confirm payment.
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
              Boarding rates and common booking options at a glance
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
                  Extended stays receive quote-specific totals shown before
                  confirmation.
                </div>
              </CardContent>
            </Card>

            {/* Multi-Dog Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Multi-Dog Pricing</CardTitle>
                <CardDescription>Same-family stays</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Second dog (same suite)</span>
                  <span className="font-semibold">Priced in quote</span>
                </div>
                <div className="flex justify-between">
                  <span>Third+ dog (same suite)</span>
                  <span className="font-semibold">Priced in quote</span>
                </div>
                <div className="flex justify-between">
                  <span>14+ night stays</span>
                  <span className="font-semibold">Priced in quote</span>
                </div>
                <div className="pt-2 text-sm text-muted-foreground">
                  Additional-dog pricing is disclosed before confirmation with
                  no hidden fees.
                </div>
              </CardContent>
            </Card>

            {/* Optional Care Selections */}
            <Card>
              <CardHeader>
                <CardTitle>Optional Care Selections</CardTitle>
                <CardDescription>Optional services per stay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Extra playtime (30 min)</span>
                  <span className="font-semibold">$15</span>
                </div>
                <div className="flex justify-between">
                  <span>Private walk</span>
                  <span className="font-semibold">$20</span>
                </div>
                <div className="flex justify-between">
                  <span>Photo package</span>
                  <span className="font-semibold">$25</span>
                </div>
                <div className="flex justify-between">
                  <span>Spa treatment</span>
                  <span className="font-semibold">$35</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Rates are reviewed regularly and confirmed before checkout. We use
              premium but fair pricing with no hidden fees and no surprise
              add-ons.
            </p>
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-3xl font-bold">
              Pricing Policies
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold">Payment</h3>
                <p className="text-muted-foreground">
                  Payment is required at booking. We accept all major credit
                  cards, debit cards, and digital wallets.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">Cancellation</h3>
                <p className="text-muted-foreground">
                  Free cancellation up to 48 hours before check-in.
                  Cancellations within 48 hours are subject to a 50% charge.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">Holiday Rates</h3>
                <p className="text-muted-foreground">
                  A 20% surcharge applies to major holidays (Thanksgiving,
                  Christmas, New Year&apos;s). Early booking recommended.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">Multiple Pets</h3>
                <p className="text-muted-foreground">
                  Multi-dog totals are itemized in your pre-confirmation quote.
                  No hidden fees or surprise add-ons are introduced at checkout.
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
            Our team can walk you through premium but fair pricing before
            confirmation so there are no hidden fees or surprise add-ons.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link href="/book">Book Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
