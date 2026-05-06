import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  assertDogTelemetryHasNoPii,
  buildDogTelemetryEvent,
  containsPiiKeys,
  createDogSessionId,
  getDogTelemetryContract,
  validateDogTelemetryEvent,
} from "../dog-mode";

describe("Dog Mode telemetry", () => {
  it("builds a valid no-PII boop event", () => {
    const event = buildDogTelemetryEvent(
      {
        event: "dog_mode_boop",
        sessionId: "dog_abc123def4",
        surface: "dog",
        mode: "standard",
        target: { id: "primary-boop", label: "Boop pad" },
        reducedMotion: true,
        highContrast: false,
        staffSignal: {
          boops: 1,
          calmRequests: 0,
          lastInteraction: "boop",
          visibility: "staff_dashboard_rollup",
        },
      },
      new Date("2026-05-05T12:00:00.000Z"),
    );

    expect(event).toEqual(
      expect.objectContaining({
        event: "dog_mode_boop",
        schemaVersion: "dog-mode-2.0",
        occurredAt: "2026-05-05T12:00:00.000Z",
      }),
    );
    expect(() => assertDogTelemetryHasNoPii(event)).not.toThrow();
  });

  it("requires schedule slot for schedule telemetry", () => {
    expect(() =>
      buildDogTelemetryEvent({
        event: "dog_mode_schedule_select",
        sessionId: "dog_abc123def4",
        surface: "dog",
        mode: "standard",
        reducedMotion: true,
        highContrast: false,
      }),
    ).toThrow(ZodError);
  });

  it("requires calmEnabled for calm toggle telemetry", () => {
    expect(() =>
      buildDogTelemetryEvent({
        event: "dog_mode_calm_toggle",
        sessionId: "dog_abc123def4",
        surface: "dog_calm",
        mode: "calm",
        reducedMotion: true,
        highContrast: false,
      }),
    ).toThrow(ZodError);
  });

  it("rejects unknown fields and detects PII-shaped keys", () => {
    expect(() =>
      validateDogTelemetryEvent({
        event: "dog_mode_boop",
        schemaVersion: "dog-mode-2.0",
        occurredAt: "2026-05-05T12:00:00.000Z",
        sessionId: "dog_abc123def4",
        surface: "dog",
        mode: "standard",
        reducedMotion: true,
        highContrast: false,
        email: "owner@example.com",
      }),
    ).toThrow(ZodError);

    expect(containsPiiKeys({ nested: { petId: "pet-1" } })).toBe(true);
    expect(containsPiiKeys({ metadata: { phoneNumber: "123" } })).toBe(true);
  });

  it("does not recurse forever on circular objects", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() => containsPiiKeys(circular)).not.toThrow();
    expect(containsPiiKeys(circular)).toBe(false);
  });

  it("publishes the staff-visible contract without identity fields", () => {
    const contract = getDogTelemetryContract();

    expect(contract.privacy.piiAllowed).toBe(false);
    expect(contract.events).toContain("dog_mode_boop");
    expect(contract.events).toContain("dog_mode_schedule_select");
    expect(contract.events).toContain("dog_mode_calm_toggle");
    expect(contract.staffVisibility.dashboard).toContain("Rollups");
    expect(contract.privacy.forbiddenKeys).toEqual(
      expect.arrayContaining(["email", "petId", "bookingId"]),
    );
  });

  it("creates anonymous kiosk session ids", () => {
    expect(createDogSessionId((length) => new Uint8Array(length).fill(1))).toMatch(
      /^dog_[a-z0-9]{10,40}$/,
    );
  });
});
