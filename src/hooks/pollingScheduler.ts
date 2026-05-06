interface PollDelayOptions {
  baseIntervalMs: number;
  consecutiveFailures: number;
  maxIntervalMs?: number;
  jitterRatio?: number;
  random?: () => number;
}

/**
 * Computes an adaptive polling delay using exponential backoff with bounded jitter.
 *
 * Formula:
 * - delay = min(baseIntervalMs * 2^consecutiveFailures, maxIntervalMs)
 * - jitter applied in range [delay * (1 - jitterRatio), delay * (1 + jitterRatio)]
 */
export function computeAdaptivePollDelay({
  baseIntervalMs,
  consecutiveFailures,
  maxIntervalMs = 120_000,
  jitterRatio = 0.2,
  random = Math.random,
}: PollDelayOptions): number {
  const safeBase = Math.max(1000, baseIntervalMs);
  const safeFailures = Math.max(0, consecutiveFailures);
  const boundedJitterRatio = Math.min(Math.max(jitterRatio, 0), 0.5);

  const exponentialDelay = safeBase * 2 ** safeFailures;
  const cappedDelay = Math.min(
    exponentialDelay,
    Math.max(maxIntervalMs, safeBase),
  );

  const minDelay = Math.floor(cappedDelay * (1 - boundedJitterRatio));
  const maxDelay = Math.ceil(cappedDelay * (1 + boundedJitterRatio));
  const jitterRange = Math.max(0, maxDelay - minDelay);

  const sampled = minDelay + Math.floor(random() * (jitterRange + 1));
  return Math.max(1000, sampled);
}
