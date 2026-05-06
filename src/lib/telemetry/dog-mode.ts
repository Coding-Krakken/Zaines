import { z } from "zod";

export const DOG_TELEMETRY_VERSION = "dog-mode-2.0";

export const dogTelemetryEventNames = [
  "dog_mode_view",
  "dog_mode_boop",
  "dog_mode_schedule_select",
  "dog_mode_calm_toggle",
  "dog_mode_motion_preference",
  "dog_mode_staff_signal_view",
] as const;

export const dogTelemetrySurfaces = ["dog", "dog_calm"] as const;

export const dogTelemetryModes = ["standard", "calm"] as const;

export const dogScheduleSlots = [
  "breakfast",
  "morning_walk",
  "quiet_rest",
  "yard_time",
  "dinner",
] as const;

const dogTelemetryEventNameSchema = z.enum(dogTelemetryEventNames);
const dogTelemetrySurfaceSchema = z.enum(dogTelemetrySurfaces);
const dogTelemetryModeSchema = z.enum(dogTelemetryModes);
const dogScheduleSlotSchema = z.enum(dogScheduleSlots);

export const dogTelemetryEventSchema = z
  .object({
    event: dogTelemetryEventNameSchema,
    schemaVersion: z.literal(DOG_TELEMETRY_VERSION),
    occurredAt: z.string().datetime(),
    sessionId: z.string().regex(/^dog_[a-z0-9]{10,40}$/),
    surface: dogTelemetrySurfaceSchema,
    mode: dogTelemetryModeSchema,
    target: z
      .object({
        id: z.string().min(1).max(64),
        label: z.string().min(1).max(80),
      })
      .optional(),
    scheduleSlot: dogScheduleSlotSchema.optional(),
    calmEnabled: z.boolean().optional(),
    reducedMotion: z.boolean(),
    highContrast: z.boolean(),
    staffSignal: z
      .object({
        calmRequests: z.number().int().min(0).max(99),
        boops: z.number().int().min(0).max(999),
        lastInteraction: z
          .enum(["none", "boop", "schedule", "calm", "motion"])
          .optional(),
        visibility: z.enum(["kiosk_only", "staff_dashboard_rollup"]),
      })
      .optional(),
  })
  .strict()
  .superRefine((event, ctx) => {
    if (event.event === "dog_mode_schedule_select" && !event.scheduleSlot) {
      ctx.addIssue({
        code: "custom",
        message: "scheduleSlot is required for schedule selection events.",
        path: ["scheduleSlot"],
      });
    }

    if (
      event.event === "dog_mode_calm_toggle" &&
      event.calmEnabled === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        message: "calmEnabled is required for calm toggle events.",
        path: ["calmEnabled"],
      });
    }
  });

export type DogTelemetryEvent = z.infer<typeof dogTelemetryEventSchema>;
export type DogTelemetryEventName = (typeof dogTelemetryEventNames)[number];
export type DogTelemetrySurface = (typeof dogTelemetrySurfaces)[number];
export type DogTelemetryMode = (typeof dogTelemetryModes)[number];
export type DogScheduleSlot = (typeof dogScheduleSlots)[number];

export type DogTelemetryInput = Omit<
  DogTelemetryEvent,
  "schemaVersion" | "occurredAt"
> & {
  occurredAt?: string;
};

const forbiddenPiiKeys = [
  "address",
  "booking",
  "bookingId",
  "bookingNumber",
  "breed",
  "email",
  "firstName",
  "lastName",
  "name",
  "owner",
  "pet",
  "petId",
  "phone",
  "suite",
  "user",
] as const;

const piiKeyPatternFragments = [
  "address",
  "booking",
  "breed",
  "contact",
  "customer",
  "email",
  "name",
  "owner",
  "pet",
  "phone",
  "suite",
  "user",
] as const;

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isPiiLikeKey(key: string): boolean {
  const normalized = normalizeKey(key);

  if (
    forbiddenPiiKeys.some((forbidden) => normalizeKey(forbidden) === normalized)
  ) {
    return true;
  }

  return piiKeyPatternFragments.some((fragment) =>
    normalized.includes(fragment),
  );
}

export function buildDogTelemetryEvent(
  input: DogTelemetryInput,
  now = new Date(),
): DogTelemetryEvent {
  return dogTelemetryEventSchema.parse({
    ...input,
    schemaVersion: DOG_TELEMETRY_VERSION,
    occurredAt: input.occurredAt ?? now.toISOString(),
  });
}

export function validateDogTelemetryEvent(value: unknown): DogTelemetryEvent {
  return dogTelemetryEventSchema.parse(value);
}

export function containsPiiKeys(
  value: unknown,
  seen: WeakSet<object> = new WeakSet(),
): boolean {
  if (!value || typeof value !== "object") return false;

  if (seen.has(value)) return false;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.some((item) => containsPiiKeys(item, seen));
  }

  return Object.entries(value as Record<string, unknown>).some(
    ([key, item]) => {
      if (isPiiLikeKey(key)) {
        return true;
      }

      return containsPiiKeys(item, seen);
    },
  );
}

export function assertDogTelemetryHasNoPii(event: DogTelemetryEvent): void {
  if (containsPiiKeys(event)) {
    throw new Error(
      "Dog Mode telemetry cannot include PII or booking details.",
    );
  }
}

function defaultRandomBytes(length: number): Uint8Array {
  const runtimeCrypto = globalThis.crypto;
  if (!runtimeCrypto) {
    throw new Error("Secure random generator unavailable for dog session id.");
  }

  const buffer = new Uint8Array(length);
  runtimeCrypto.getRandomValues(buffer);
  return buffer;
}

export function createDogSessionId(
  randomBytes: (length: number) => Uint8Array = defaultRandomBytes,
): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(12);
  const segment = Array.from(
    bytes,
    (byte) => alphabet[byte % alphabet.length],
  ).join("");
  return `dog_${segment}`;
}

export function getDogTelemetryContract() {
  return {
    schemaVersion: DOG_TELEMETRY_VERSION,
    events: dogTelemetryEventNames,
    surfaces: dogTelemetrySurfaces,
    modes: dogTelemetryModes,
    scheduleSlots: dogScheduleSlots,
    privacy: {
      piiAllowed: false,
      forbiddenKeys: forbiddenPiiKeys,
      retention:
        "Aggregate kiosk interaction counts only; no owner, pet, booking, suite, or contact fields.",
    },
    staffVisibility: {
      kiosk:
        "Current session boops, calm requests, last interaction, and reduced-motion state.",
      dashboard:
        "Rollups by hour/day for calm toggles, boops, and schedule taps only.",
    },
  };
}
