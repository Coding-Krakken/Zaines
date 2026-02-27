export type AvailabilityState =
  | "idle"
  | "validating_input"
  | "checking_availability"
  | "available"
  | "unavailable_recoverable"
  | "invalid_input"
  | "service_degraded";

export type AvailabilityErrorCode =
  | "INVALID_DATE_RANGE"
  | "AVAILABILITY_UNAVAILABLE";

export type AvailabilitySuccessResponse = {
  isAvailable: boolean;
  reasonCode: "NONE" | "NO_CAPACITY" | "BLACKOUT";
  nextRetryAfterSeconds?: number;
};

export type AvailabilityErrorResponse = {
  errorCode?: AvailabilityErrorCode;
  message?: string;
  retryable?: boolean;
  correlationId?: string;
};

export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}
