"use client";

import { useState, useEffect } from "react";
/* eslint-disable react/no-unescaped-entities */
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, PawPrint, Home, User, CheckCircle2, ArrowRight, ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";

type BookingStep = "dates" | "service" | "suite" | "contact" | "payment" | "confirmation";

function PaymentForm({ onSuccess, onBack }: { clientSecret: string; onSuccess: () => void; onBack: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast.success("Payment successful!");
        onSuccess();
      }
    } catch {  toast.error("An error occurred during payment");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isProcessing}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay Now
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function BookPage() {
  const { status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<BookingStep>("dates");
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    serviceType: "",
    suiteType: "",
    petCount: "1",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    petName: "",
    specialRequests: "",
  });
  const [totalAmount, setTotalAmount] = useState(0);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Please sign in to book a stay");
      router.push("/auth/signin?callbackUrl=/book");
    }
  }, [status, router]);

  // Calculate total amount
  useEffect(() => {
    if (bookingData.checkIn && bookingData.checkOut && bookingData.suiteType) {
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      const prices: Record<string, number> = {
        standard: 65,
        deluxe: 85,
        luxury: 120,
      };
      
      const nightlyRate = prices[bookingData.suiteType] || 65;
      setTotalAmount(nightlyRate * nights);
    }
  }, [bookingData.checkIn, bookingData.checkOut, bookingData.suiteType]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const steps: { id: BookingStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dates", label: "Dates", icon: Calendar },
    { id: "service", label: "Service", icon: PawPrint },
    { id: "suite", label: "Suite", icon: Home },
    { id: "contact", label: "Contact", icon: User },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "confirmation", label: "Confirm", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // Get user's first pet ID (in production, let user select pet)
      const petsResponse = await fetch("/api/pets");
      const pets = await petsResponse.json();
      
      if (!pets || pets.length === 0) {
        toast.error("Please add a pet to your account before booking");
        router.push("/dashboard/pets");
        return;
      }

      // Create booking
      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          serviceType: bookingData.serviceType,
          suiteType: bookingData.suiteType,
          petIds: [pets[0].id], // In production, let user select pets
          specialRequests: bookingData.specialRequests,
        }),
      });

      if (!bookingResponse.ok) {
        const error = await bookingResponse.json();
        throw new Error(error.error || "Failed to create booking");
      }

      const booking = await bookingResponse.json();
      setBookingId(booking.id);

      // Create payment intent
      const paymentResponse = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: totalAmount,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error("Failed to initialize payment");
      }

      const { clientSecret } = await paymentResponse.json();
      setClientSecret(clientSecret);
      setCurrentStep("payment");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process booking");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold">Book Your Stay</h1>
          <p className="text-lg text-muted-foreground">
            Just a few steps to reserve your pet&apos;s vacation
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mx-auto mb-8 max-w-4xl">
          <Progress value={progress} className="mb-4 h-2" />
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStepIndex > index;
              
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-2 ${
                    isActive ? "text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCompleted
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="hidden text-sm font-medium sm:block">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="mx-auto max-w-2xl">
          {currentStep === "dates" && (
            <Card>
              <CardHeader>
                <CardTitle>Select Your Dates</CardTitle>
                <CardDescription>
                  When would you like to board your pet?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">Check-in Date</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={bookingData.checkIn}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, checkIn: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut">Check-out Date</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={bookingData.checkOut}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, checkOut: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petCount">Number of Pets</Label>
                  <Select
                    value={bookingData.petCount}
                    onValueChange={(value) =>
                      setBookingData({ ...bookingData, petCount: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? "Pet" : "Pets"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button onClick={nextStep} disabled={!bookingData.checkIn || !bookingData.checkOut}>
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === "service" && (
            <Card>
              <CardHeader>
                <CardTitle>Select Service Type</CardTitle>
                <CardDescription>
                  What service are you interested in?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {[
                    { value: "boarding", label: "Dog Boarding", price: "$65-120/night" },
                    { value: "daycare", label: "Daycare", price: "$45/day" },
                    { value: "grooming", label: "Grooming", price: "$45-180" },
                  ].map((service) => (
                    <button
                      key={service.value}
                      onClick={() => {
                        setBookingData({ ...bookingData, serviceType: service.value });
                      }}
                      className={`rounded-lg border-2 p-4 text-left transition-all hover:border-primary ${
                        bookingData.serviceType === service.value
                          ? "border-primary bg-primary/5"
                          : "border-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{service.label}</div>
                          <div className="text-sm text-muted-foreground">{service.price}</div>
                        </div>
                        {bookingData.serviceType === service.value && (
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={nextStep} disabled={!bookingData.serviceType}>
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === "suite" && (
            <Card>
              <CardHeader>
                <CardTitle>Select Suite Type</CardTitle>
                <CardDescription>
                  Choose your pet&apos;s accommodations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {[
                    { value: "standard", label: "Standard Suite", price: "$65/night", features: "6x8 ft, Raised bed" },
                    { value: "deluxe", label: "Deluxe Suite", price: "$85/night", features: "8x10 ft, TV, Webcam", badge: "Popular" },
                    { value: "luxury", label: "Luxury Suite", price: "$120/night", features: "10x12 ft, Private patio, HD webcam" },
                  ].map((suite) => (
                    <button
                      key={suite.value}
                      onClick={() => {
                        setBookingData({ ...bookingData, suiteType: suite.value });
                      }}
                      className={`rounded-lg border-2 p-4 text-left transition-all hover:border-primary ${
                        bookingData.suiteType === suite.value
                          ? "border-primary bg-primary/5"
                          : "border-muted"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-semibold">{suite.label}</span>
                            {suite.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {suite.badge}
                              </Badge>
                            )}
                          </div>
                          <div className="mb-1 font-semibold text-primary">{suite.price}</div>
                          <div className="text-sm text-muted-foreground">{suite.features}</div>
                        </div>
                        {bookingData.suiteType === suite.value && (
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={nextStep} disabled={!bookingData.suiteType}>
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === "contact" && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Tell us about you and your pet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={bookingData.firstName}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={bookingData.lastName}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={bookingData.email}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={bookingData.phone}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petName">Pet Name(s)</Label>
                  <Input
                    id="petName"
                    value={bookingData.petName}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, petName: e.target.value })
                    }
                    placeholder="Max, Bella"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                  <Textarea
                    id="specialRequests"
                    value={bookingData.specialRequests}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, specialRequests: e.target.value })
                    }
                    placeholder="Any special needs or requests..."
                  />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      isLoading ||
                      !bookingData.firstName ||
                      !bookingData.lastName ||
                      !bookingData.email ||
                      !bookingData.phone ||
                      !bookingData.petName
                    }
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Continue to Payment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === "payment" && clientSecret && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>
                  Total Amount: ${totalAmount.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements 
                  stripe={getStripe()} 
                  options={{ 
                    clientSecret,
                    appearance: { theme: 'stripe' }
                  }}
                >
                  <PaymentForm
                    clientSecret={clientSecret}
                    onSuccess={() => setCurrentStep("confirmation")}
                    onBack={prevStep}
                  />
                </Elements>
              </CardContent>
            </Card>
          )}

          {currentStep === "confirmation" && (
            <Card className="border-green-500 bg-green-50">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
                <CardTitle className="text-center text-2xl">Booking Confirmed!</CardTitle>
                <CardDescription className="text-center">
                  Thank you for choosing Zaine's Stay & Play
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-white p-6 space-y-3">
                  <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>
                  {bookingId && (
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Booking ID:</span>
                        <span className="font-bold text-primary text-lg">{bookingId}</span>
                      </div>
                    </div>
                  )}
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dates:</span>
                      <span className="font-medium">
                        {new Date(bookingData.checkIn).toLocaleDateString()} to {new Date(bookingData.checkOut).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service:</span>
                      <span className="font-medium capitalize">{bookingData.serviceType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Suite:</span>
                      <span className="font-medium capitalize">{bookingData.suiteType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Paid:</span>
                      <span className="font-bold text-green-600">${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pets:</span>
                      <span className="font-medium">{bookingData.petName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium">{bookingData.email}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="text-sm text-blue-900">
                    📧 A confirmation email has been sent to <strong>{bookingData.email}</strong>
                  </p>
                  <p className="mt-2 text-sm text-blue-900">
                    📱 You can view and manage your booking in your dashboard.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/dashboard">View Dashboard</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/">Return to Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
