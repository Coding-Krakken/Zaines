export type AvailabilityGuardInput = {
  checkIn?: string;
  checkOut?: string;
  serviceType?: string;
};

export function hasValidDateRange(
  checkIn?: string,
  checkOut?: string,
): boolean {
  if (!checkIn || !checkOut) {
    return false;
  }

  return new Date(checkOut) > new Date(checkIn);
}

export function canDispatchAvailabilityCheck(
  input: AvailabilityGuardInput,
): boolean {
  return (
    Boolean(input.serviceType) &&
    hasValidDateRange(input.checkIn, input.checkOut)
  );
}
