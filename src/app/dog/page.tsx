"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function DogModePage() {
  const [treats, setTreats] = useState(9);
  const [highContrast, setHighContrast] = useState(false);
  const [lowMotion, setLowMotion] = useState(false);

  const handleBoop = () => {
    // Fun interaction
    console.log("Boop! 🐾");
  };

  const handleTreat = () => {
    if (treats < 20) {
      setTreats(treats + 1);
    }
  };

  return (
    <div
      className={`min-h-screen ${
        highContrast
          ? "bg-white"
          : "bg-gradient-to-br from-yellow-100 via-orange-50 to-pink-100"
      }`}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Accessibility Controls */}
        <div className="mb-8 flex justify-end gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={setHighContrast}
            />
            <Label htmlFor="high-contrast" className="text-sm">
              High Contrast
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="low-motion"
              checked={lowMotion}
              onCheckedChange={setLowMotion}
            />
            <Label htmlFor="low-motion" className="text-sm">
              Low Motion
            </Label>
          </div>
        </div>

        {/* Main Heading */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center gap-2">
            {!lowMotion && (
              <>
                <Sparkles className="h-8 w-8 animate-pulse text-yellow-500" />
                <Sparkles className="h-8 w-8 animate-pulse text-pink-500" />
              </>
            )}
          </div>
          <h1 className="mb-4 text-6xl font-bold md:text-8xl">
            🐕 Dog Mode 🐕
          </h1>
          <p className="text-2xl font-medium text-gray-700 md:text-3xl">
            A special mode designed just for our furry friends!
          </p>
        </div>

        {/* Boop Button */}
        <div className="mb-16 flex justify-center">
          <button
            onClick={handleBoop}
            className={`group relative h-64 w-64 rounded-full bg-gradient-to-br from-pink-400 via-red-400 to-orange-400 shadow-2xl transition-all focus:outline-none focus:ring-8 focus:ring-yellow-300 ${
              !lowMotion && "hover:scale-110 active:scale-95"
            }`}
          >
            {!lowMotion && (
              <div className="absolute inset-0 animate-ping rounded-full bg-pink-400 opacity-20"></div>
            )}
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <span className={`text-7xl ${!lowMotion && "animate-bounce"}`}>
                🐾
              </span>
              <span className="text-3xl font-bold text-white">BOOP ME!</span>
            </div>
          </button>
        </div>

        {/* Today's Schedule */}
        <div className="mb-12">
          <Card className="mx-auto max-w-4xl">
            <CardContent className="pt-8">
              <div className="mb-6 flex items-center justify-center gap-2">
                <span className="text-3xl">📅</span>
                <h2 className="text-3xl font-bold">Today&apos;s Schedule</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { emoji: "🍖", time: "8:00 AM", activity: "Breakfast" },
                  { emoji: "🚶", time: "10:00 AM", activity: "Walk" },
                  { emoji: "🎾", time: "2:00 PM", activity: "Playtime" },
                  { emoji: "😴", time: "6:00 PM", activity: "Nap Time" },
                ].map((item) => (
                  <div
                    key={item.time}
                    className="flex flex-col items-center gap-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-6 text-center"
                  >
                    <div className="text-6xl">{item.emoji}</div>
                    <div className="text-xl font-bold text-gray-800">
                      {item.time}
                    </div>
                    <div className="text-lg text-gray-600">{item.activity}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Treat Meter */}
        <div className="mb-12">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="pt-8">
              <div className="mb-6 text-center">
                <h2 className="mb-4 text-3xl font-bold">🦴 Treat Meter 🦴</h2>
                <div className="mb-2 text-xl font-semibold">
                  {treats} / 20 treats today!
                </div>
                <Progress value={(treats / 20) * 100} className="h-4" />
              </div>
              <Button
                onClick={handleTreat}
                disabled={treats >= 20}
                size="lg"
                className="w-full text-2xl py-8"
              >
                {treats >= 20 ? "All treats earned! 🎉" : "Tap for Treat! 🦴"}
              </Button>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Note: This is just for fun! No real purchases required.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Calm Mode Link */}
        <div className="mb-8 flex justify-center">
          <Button variant="ghost" size="lg" asChild>
            <Link href="/dog/calm">🌙 Enter Calm Mode</Link>
          </Button>
        </div>

        {/* Back to Regular Site */}
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Regular Site
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
