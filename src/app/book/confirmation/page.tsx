"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CalendarDays } from "lucide-react";
import { generateICSFile, downloadICSFile } from "@/lib/calendar-export";
import Link from "next/link";

interface ConfirmationPageProps {
  booking: {
    id: string;
    checkIn: string;
    checkOut: string;
    suite: string;
    total: number;
    petNames: string[];
    email: string;
  };
}

export default function ConfirmationPage({ booking }: ConfirmationPageProps) {
  const handleDownloadCalendar = () => {
    const calendarEvent = generateICSFile({
      title: `Pet Stay at Zaine's Stay & Play`,
      description: `Suite: ${booking.suite}\nPets: ${booking.petNames.join(", ")}`,
      start: booking.checkIn,
      end: booking.checkOut,
      location: "Zaine's Stay & Play, Syracuse, NY",
    });

    downloadICSFile(calendarEvent, `Booking-${booking.id}.ics`);
  };

  return (
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
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dates:</span>
              <span className="font-medium">
                {new Date(booking.checkIn).toLocaleDateString()} to {new Date(booking.checkOut).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suite:</span>
              <span className="font-medium capitalize">{booking.suite}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Paid:</span>
              <span className="font-bold text-green-600">${booking.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pets:</span>
              <span className="font-medium">{booking.petNames.join(", ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact:</span>
              <span className="font-medium">{booking.email}</span>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-900">
            📧 A confirmation email has been sent to <strong>{booking.email}</strong>
          </p>
          <p className="mt-2 text-sm text-blue-900">
            📱 You can view and manage your booking in your dashboard.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleDownloadCalendar} variant="outline">
            <CalendarDays className="mr-2 h-4 w-4" />
            Add to Calendar
          </Button>
          <Button asChild>
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}