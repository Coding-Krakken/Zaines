import { describe, expect, it } from "vitest";
import {
  canDispatchAvailabilityCheck,
  hasValidDateRange,
} from "@/lib/booking/availability-flow";

describe("booking availability guards", () => {
  it("returns false when check-out is not after check-in", () => {
    expect(hasValidDateRange("2026-03-05", "2026-03-05")).toBe(false);
    expect(hasValidDateRange("2026-03-06", "2026-03-05")).toBe(false);
  });

  it("returns true when check-out is after check-in", () => {
    expect(hasValidDateRange("2026-03-01", "2026-03-05")).toBe(true);
  });

  it("prevents dispatch when required fields are missing or invalid", () => {
    expect(
      canDispatchAvailabilityCheck({
        checkIn: "2026-03-01",
        checkOut: "2026-03-01",
        serviceType: "boarding",
      }),
    ).toBe(false);
    expect(
      canDispatchAvailabilityCheck({
        checkIn: "2026-03-01",
        checkOut: "2026-03-05",
      }),
    ).toBe(false);
    expect(
      canDispatchAvailabilityCheck({
        checkIn: "2026-03-01",
        checkOut: "2026-03-05",
        serviceType: "boarding",
      }),
    ).toBe(true);
  });
});
