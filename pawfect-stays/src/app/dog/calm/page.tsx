"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";

export default function CalmModePage() {
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Pre-defined cloud positions for consistent rendering
  const cloudPositions = [
    { top: 15, left: 10 },
    { top: 45, left: 70 },
    { top: 65, left: 25 },
    { top: 30, left: 85 },
    { top: 75, left: 55 },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute h-96 w-96 animate-pulse rounded-full bg-blue-500/20 blur-3xl" style={{ top: "10%", left: "10%", animationDuration: "8s" }}></div>
        <div className="absolute h-96 w-96 animate-pulse rounded-full bg-purple-500/20 blur-3xl" style={{ top: "40%", right: "10%", animationDuration: "10s", animationDelay: "2s" }}></div>
        <div className="absolute h-96 w-96 animate-pulse rounded-full bg-pink-500/20 blur-3xl" style={{ bottom: "10%", left: "30%", animationDuration: "12s", animationDelay: "4s" }}></div>
      </div>

      {/* Floating Clouds */}
      <div className="absolute inset-0 overflow-hidden">
        {cloudPositions.map((pos, i) => (
          <div
            key={i}
            className="absolute animate-float text-6xl opacity-20"
            style={{
              top: `${pos.top}%`,
              left: `${pos.left}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${20 + i * 5}s`,
            }}
          >
            ☁️
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-6xl font-bold text-white/90 md:text-8xl">
            😌
          </h1>
          <h2 className="text-4xl font-bold text-white/80 md:text-5xl">
            Calm Mode
          </h2>
          <p className="mt-4 text-xl text-white/60">
            Relax and enjoy the peaceful vibes
          </p>
        </div>

        {/* Sound Toggle */}
        <div className="mb-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="mr-2 h-5 w-5" />
                Sound On
              </>
            ) : (
              <>
                <VolumeX className="mr-2 h-5 w-5" />
                Sound Off
              </>
            )}
          </Button>
          <p className="mt-2 text-center text-sm text-white/50">
            {soundEnabled ? "Soft music playing" : "Tap to enable soft music"}
          </p>
        </div>

        {/* Exit Button */}
        <Button
          variant="ghost"
          size="lg"
          asChild
          className="text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Link href="/dog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit Calm Mode
          </Link>
        </Button>
      </div>

      {/* Breathing Circle Animation */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="h-64 w-64 rounded-full border-4 border-white/20 animate-breathe"
          style={{
            animation: "breathe 6s ease-in-out infinite",
          }}
        ></div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-100px) translateX(50px);
          }
        }
        
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.4;
          }
        }
        
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        
        .animate-breathe {
          animation: breathe 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
