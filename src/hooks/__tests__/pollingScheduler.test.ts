import { describe, expect, it } from "vitest";
import { computeAdaptivePollDelay } from "@/hooks/pollingScheduler";

describe("computeAdaptivePollDelay", () => {
  it("uses base interval with jitter when there are no failures", () => {
    const delay = computeAdaptivePollDelay({
      baseIntervalMs: 30_000,
      consecutiveFailures: 0,
      random: () => 0.5,
    });

    // 30_000 with 20% jitter => range [24_000, 36_000], midpoint is 30_000
    expect(delay).toBe(30_000);
  });

  it("increases delay exponentially for consecutive failures", () => {
    const delay = computeAdaptivePollDelay({
      baseIntervalMs: 10_000,
      consecutiveFailures: 2,
      random: () => 0,
      jitterRatio: 0,
    });

    // 10_000 * 2^2 = 40_000
    expect(delay).toBe(40_000);
  });

  it("caps delay at maxIntervalMs", () => {
    const delay = computeAdaptivePollDelay({
      baseIntervalMs: 30_000,
      consecutiveFailures: 6,
      maxIntervalMs: 90_000,
      random: () => 0,
      jitterRatio: 0,
    });

    expect(delay).toBe(90_000);
  });

  it("enforces minimum lower bound of 1000ms", () => {
    const delay = computeAdaptivePollDelay({
      baseIntervalMs: 100,
      consecutiveFailures: 0,
      random: () => 0,
      jitterRatio: 0,
    });

    expect(delay).toBe(1000);
  });
});
