"use client";

import Link from "next/link";
import type React from "react";
import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  Eye,
  Moon,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  assertDogTelemetryHasNoPii,
  buildDogTelemetryEvent,
  createDogSessionId,
  type DogScheduleSlot,
  type DogTelemetryEvent,
  type DogTelemetryMode,
  type DogTelemetrySurface,
} from "@/lib/telemetry/dog-mode";
import { cn } from "@/lib/utils";

type ScheduleItem = {
  id: DogScheduleSlot;
  time: string;
  title: string;
  signal: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const schedule: ScheduleItem[] = [
  {
    id: "breakfast",
    time: "8:00 AM",
    title: "Breakfast",
    signal: "Food routine visible",
    icon: Sun,
  },
  {
    id: "morning_walk",
    time: "10:00 AM",
    title: "Walk",
    signal: "Potty break tapped",
    icon: PawPrint,
  },
  {
    id: "quiet_rest",
    time: "12:30 PM",
    title: "Quiet Rest",
    signal: "Rest cue requested",
    icon: Moon,
  },
  {
    id: "yard_time",
    time: "2:00 PM",
    title: "Yard Time",
    signal: "Play interest tapped",
    icon: Sparkles,
  },
  {
    id: "dinner",
    time: "6:00 PM",
    title: "Dinner",
    signal: "Evening routine visible",
    icon: CalendarClock,
  },
];

function useDogTelemetry(surface: DogTelemetrySurface, mode: DogTelemetryMode) {
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return "dog_0000000000";
    try {
      const existing = window.sessionStorage.getItem("dog-mode-session-id");
      if (existing) return existing;
      const next = createDogSessionId();
      window.sessionStorage.setItem("dog-mode-session-id", next);
      return next;
    } catch (error) {
      // Catch SecurityError from private browsing or Tracking Prevention
      if (error instanceof Error && error.name === 'SecurityError') {
        console.warn("Storage access blocked by browser privacy settings.");
        return `dog_${Math.random().toString(36).substr(2, 10)}`;
      }
      throw error;
    }
  });

  return (
    event: Omit<
      DogTelemetryEvent,
      "schemaVersion" | "occurredAt" | "sessionId" | "surface" | "mode"
    >,
  ) => {
    const payload = buildDogTelemetryEvent({
      ...event,
      sessionId,
      surface,
      mode,
    });
    assertDogTelemetryHasNoPii(payload);

    let stored: DogTelemetryEvent[] = [];
    try {
      const raw = window.localStorage.getItem("dog-mode-telemetry");
      const parsed = raw ? JSON.parse(raw) : [];
      stored = Array.isArray(parsed) ? (parsed as DogTelemetryEvent[]) : [];
    } catch (error) {
      // Catch SecurityError and QuotaExceededError
      if (error instanceof Error && (error.name === 'SecurityError' || error.name === 'QuotaExceededError')) {
        console.warn("Storage access blocked or quota exceeded. Telemetry will not persist.");
      } else {
        console.error("Failed to load telemetry:", error);
      }
      stored = [];
    }

    const next = [...stored.slice(-49), payload];
    try {
      window.localStorage.setItem("dog-mode-telemetry", JSON.stringify(next));
    } catch (error) {
      // Silently fail if storage not available (Tracking Prevention, private browsing)
      if (!(error instanceof Error && (error.name === 'SecurityError' || error.name === 'QuotaExceededError'))) {
        console.error("Failed to save telemetry:", error);
      }
    }
    window.dispatchEvent(
      new CustomEvent("dog-mode-telemetry", { detail: payload }),
    );
  };
}

type DogTelemetryClientEvent = Omit<
  DogTelemetryEvent,
  | "schemaVersion"
  | "occurredAt"
  | "sessionId"
  | "surface"
  | "mode"
  | "reducedMotion"
  | "highContrast"
  | "staffSignal"
> &
  Partial<
    Pick<DogTelemetryEvent, "reducedMotion" | "highContrast" | "staffSignal">
  >;

export function DogModeExperience() {
  const [boops, setBoops] = useState(0);
  const [selectedSchedule, setSelectedSchedule] =
    useState<DogScheduleSlot>("quiet_rest");
  const [calmHintEnabled, setCalmHintEnabled] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [lastInteraction, setLastInteraction] = useState<
    "none" | "boop" | "schedule" | "calm" | "motion"
  >("none");
  const track = useDogTelemetry("dog", calmHintEnabled ? "calm" : "standard");

  const staffSignal = {
    boops,
    calmRequests: calmHintEnabled ? 1 : 0,
    lastInteraction,
    visibility: "staff_dashboard_rollup" as const,
  };

  function trackBase(event: DogTelemetryClientEvent) {
    track({
      ...event,
      reducedMotion,
      highContrast,
      staffSignal,
    });
  }

  function handleBoop() {
    const nextBoops = boops + 1;
    setBoops(nextBoops);
    setLastInteraction("boop");
    track({
      event: "dog_mode_boop",
      target: { id: "primary-boop", label: "Boop pad" },
      reducedMotion,
      highContrast,
      staffSignal: {
        ...staffSignal,
        boops: nextBoops,
        lastInteraction: "boop",
      },
    });
  }

  function handleScheduleSelect(item: ScheduleItem) {
    setSelectedSchedule(item.id);
    setLastInteraction("schedule");
    trackBase({
      event: "dog_mode_schedule_select",
      target: { id: item.id, label: item.title },
      scheduleSlot: item.id,
    });
  }

  function handleCalmToggle(value: boolean) {
    setCalmHintEnabled(value);
    setLastInteraction("calm");
    track({
      event: "dog_mode_calm_toggle",
      target: { id: "calm-toggle", label: "Calm mode shortcut" },
      calmEnabled: value,
      reducedMotion,
      highContrast,
      staffSignal: {
        ...staffSignal,
        calmRequests: value ? 1 : 0,
        lastInteraction: "calm",
      },
    });
  }

  function handleMotionToggle(value: boolean) {
    setReducedMotion(value);
    setLastInteraction("motion");
    track({
      event: "dog_mode_motion_preference",
      target: { id: "reduced-motion", label: "Reduced motion" },
      reducedMotion: value,
      highContrast,
      staffSignal: {
        ...staffSignal,
        lastInteraction: "motion",
      },
    });
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-[#f7f4ec] text-[#17211c]",
        highContrast && "bg-white text-black",
      )}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-lg border border-[#d7d0c2] bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-[#6b5b2a]">
              Suite tablet
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Dog Mode
            </h1>
            <p className="mt-2 max-w-2xl text-lg text-[#4b5a50] md:text-xl">
              Calm, readable controls for suite-side interaction.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:min-w-[460px]">
            <ToggleTile
              id="high-contrast"
              label="Contrast"
              checked={highContrast}
              onCheckedChange={setHighContrast}
            />
            <ToggleTile
              id="reduced-motion"
              label="Still"
              checked={reducedMotion}
              onCheckedChange={handleMotionToggle}
            />
            <ToggleTile
              id="calm-toggle"
              label="Calm"
              checked={calmHintEnabled}
              onCheckedChange={handleCalmToggle}
            />
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="flex flex-col gap-6">
            <button
              type="button"
              onClick={handleBoop}
              aria-label={`Boop pad. ${boops} boops this session.`}
              className={cn(
                "min-h-[280px] rounded-lg border-4 border-[#17211c] bg-[#d95f43] p-6 text-left text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2f6fed]",
                "active:translate-y-0.5 md:min-h-[360px]",
                !reducedMotion && "hover:scale-[1.01]",
                highContrast && "border-black bg-black text-white",
              )}
            >
              <span className="flex h-full flex-col justify-between gap-8">
                <span className="flex items-center justify-between">
                  <PawPrint className="size-20" aria-hidden />
                  <span className="rounded-md bg-white px-4 py-2 text-3xl font-bold text-[#17211c]">
                    {boops}
                  </span>
                </span>
                <span>
                  <span className="block text-5xl font-bold leading-none md:text-7xl">
                    Boop
                  </span>
                  <span className="mt-4 block text-2xl font-semibold">
                    One huge touch target. No surprise motion.
                  </span>
                </span>
              </span>
            </button>

            <section
              aria-labelledby="dog-schedule-title"
              className="rounded-lg border border-[#d7d0c2] bg-white p-4 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 id="dog-schedule-title" className="text-2xl font-bold">
                    Today&apos;s Routine
                  </h2>
                  <p className="text-base text-[#4b5a50]">
                    Tap a routine card to show interest to staff.
                  </p>
                </div>
                <CalendarClock className="size-10 text-[#2f6f5f]" aria-hidden />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {schedule.map((item) => {
                  const Icon = item.icon;
                  const selected = selectedSchedule === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleScheduleSelect(item)}
                      aria-pressed={selected}
                      className={cn(
                        "min-h-[132px] rounded-lg border-2 border-[#d7d0c2] bg-[#f7f4ec] p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2f6fed]",
                        selected && "border-[#2f6f5f] bg-[#e6f2ec]",
                        highContrast && "border-black bg-white text-black",
                        highContrast && selected && "bg-black text-white",
                      )}
                    >
                      <Icon className="mb-3 size-9" aria-hidden />
                      <span className="block text-lg font-bold">
                        {item.time}
                      </span>
                      <span className="block text-xl font-bold">
                        {item.title}
                      </span>
                      <span className="mt-2 block text-sm">{item.signal}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <section
            className="flex flex-col gap-6"
            aria-label="Dog Mode controls"
          >
            <section
              aria-labelledby="calm-panel-title"
              className={cn(
                "rounded-lg border border-[#b7cabf] bg-[#e6f2ec] p-5 shadow-sm",
                highContrast && "border-black bg-white",
              )}
            >
              <div className="flex items-start gap-4">
                <Moon className="mt-1 size-12 text-[#2f6f5f]" aria-hidden />
                <div>
                  <h2 id="calm-panel-title" className="text-2xl font-bold">
                    Calm shortcut
                  </h2>
                  <p className="mt-2 text-lg text-[#30493e]">
                    Keep the toggle here for low-friction calming, or open the
                    dedicated calm screen when the suite needs less visual
                    input.
                  </p>
                </div>
              </div>
              <Button
                asChild
                size="lg"
                className="mt-5 h-16 w-full text-xl"
                onClick={() =>
                  trackBase({
                    event: "dog_mode_calm_toggle",
                    calmEnabled: true,
                    target: { id: "enter-calm-mode", label: "Enter Calm Mode" },
                  })
                }
              >
                <Link href="/dog/calm">
                  <Moon className="size-6" aria-hidden />
                  Enter Calm Mode
                </Link>
              </Button>
            </section>

            <section
              aria-labelledby="staff-signal-title"
              className="rounded-lg border border-[#d7d0c2] bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <ShieldCheck className="size-9 text-[#2f6f5f]" aria-hidden />
                <div>
                  <h2 id="staff-signal-title" className="text-2xl font-bold">
                    Staff signal
                  </h2>
                  <p className="text-base text-[#4b5a50]">
                    Kiosk rollup only, no owner or pet details.
                  </p>
                </div>
              </div>
              <dl className="grid gap-3">
                <SignalRow label="Boops" value={String(boops)} />
                <SignalRow
                  label="Calm requests"
                  value={calmHintEnabled ? "On" : "Off"}
                />
                <SignalRow label="Last tap" value={lastInteraction} />
                <SignalRow
                  label="Motion default"
                  value={reducedMotion ? "Still" : "Animated"}
                />
              </dl>
            </section>

            <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 text-lg"
              >
                <Link href="/">
                  <ArrowLeft className="size-5" aria-hidden />
                  Regular Site
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-14 text-lg"
                onClick={() =>
                  trackBase({
                    event: "dog_mode_staff_signal_view",
                    target: {
                      id: "staff-signal-panel",
                      label: "Staff signal panel",
                    },
                  })
                }
              >
                <Eye className="size-5" aria-hidden />
                Signal Visible
              </Button>
            </nav>
          </section>
        </section>
      </div>
    </div>
  );
}

export function CalmModeExperience() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [calmSessions, setCalmSessions] = useState(1);
  const track = useDogTelemetry("dog_calm", "calm");

  function trackCalmToggle(next: boolean) {
    setCalmSessions((current) => current + (next ? 1 : 0));
    track({
      event: "dog_mode_calm_toggle",
      target: { id: "calm-audio-toggle", label: "Calm audio" },
      calmEnabled: next,
      reducedMotion,
      highContrast,
      staffSignal: {
        boops: 0,
        calmRequests: calmSessions + (next ? 1 : 0),
        lastInteraction: "calm",
        visibility: "staff_dashboard_rollup",
      },
    });
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-[#102820] text-white",
        highContrast && "bg-black text-white",
      )}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-lg border border-white/20 bg-white/10 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-[#f6d365]">
              Low stimulation
            </p>
            <h1 className="text-4xl font-bold md:text-6xl">Calm Mode</h1>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ToggleTile
              id="calm-contrast"
              label="Contrast"
              checked={highContrast}
              onCheckedChange={setHighContrast}
              dark
            />
            <ToggleTile
              id="calm-reduced-motion"
              label="Still"
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
              dark
            />
          </div>
        </header>

        <section className="grid flex-1 place-items-center gap-8 py-8 text-center">
          <div
            aria-hidden
            className={cn(
              "grid size-64 place-items-center rounded-full border-4 border-white/30 bg-[#2f6f5f]",
              !reducedMotion && "animate-pulse",
              highContrast && "border-white bg-white text-black",
            )}
          >
            <Moon className="size-28" />
          </div>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold md:text-5xl">
              Quiet screen, simple choices
            </h2>
            <p className="mt-4 text-xl text-white/80">
              Motion is off by default. Audio starts only after a clear touch.
            </p>
          </div>

          <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
            <Button
              type="button"
              size="lg"
              variant="outline"
              aria-pressed={soundEnabled}
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                trackCalmToggle(next);
              }}
              className="h-20 border-white/30 bg-white text-xl text-[#102820] hover:bg-[#f6d365]"
            >
              {soundEnabled ? (
                <Volume2 className="size-7" aria-hidden />
              ) : (
                <VolumeX className="size-7" aria-hidden />
              )}
              {soundEnabled ? "Sound On" : "Sound Off"}
            </Button>
            <Button
              asChild
              size="lg"
              className="h-20 bg-[#f6d365] text-xl text-[#102820] hover:bg-[#f9e19a]"
            >
              <Link href="/dog">
                <ArrowLeft className="size-7" aria-hidden />
                Exit Calm
              </Link>
            </Button>
          </div>

          <section
            aria-labelledby="calm-staff-signal-title"
            className="w-full max-w-2xl rounded-lg border border-white/20 bg-white/10 p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Bell className="size-8 text-[#f6d365]" aria-hidden />
              <h2 id="calm-staff-signal-title" className="text-2xl font-bold">
                Staff signal visible
              </h2>
            </div>
            <p className="mt-2 text-lg text-white/80">
              Staff see calm requests and audio state as aggregate suite-tablet
              signals only.
            </p>
          </section>
        </section>
      </div>
    </div>
  );
}

function ToggleTile({
  id,
  label,
  checked,
  onCheckedChange,
  dark = false,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  dark?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-[76px] cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#d7d0c2] bg-[#f7f4ec] px-4 text-lg font-bold",
        dark && "border-white/20 bg-white/10 text-white",
      )}
    >
      <span>{label}</span>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        className="scale-150"
      />
    </label>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 rounded-lg bg-[#f7f4ec] px-4">
      <dt className="font-semibold text-[#4b5a50]">{label}</dt>
      <dd className="text-xl font-bold capitalize text-[#17211c]">{value}</dd>
    </div>
  );
}
