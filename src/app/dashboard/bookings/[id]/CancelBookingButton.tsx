"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type CancelBookingButtonProps = {
  bookingId: string;
  bookingStatus: string;
  canCancel: boolean;
  compact?: boolean;
};

type CancellationPayload = {
  error?: string;
  cancellation?: {
    message?: string;
    refundEligibleAmount?: number;
    refundedAmount?: number;
    refundPendingAmount?: number;
  };
};

export function CancelBookingButton({
  bookingId,
  bookingStatus,
  canCancel,
  compact = false,
}: CancelBookingButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleCancelBooking = async () => {
    if (!canCancel) {
      toast.error("This booking cannot be cancelled in its current state.");
      return;
    }

    const confirmed = window.confirm(
      "Cancel this booking now? Cancellation terms and refund policy will be applied.",
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
      });

      const payload = (await response.json()) as CancellationPayload;

      if (!response.ok) {
        toast.error(payload.error || "Unable to cancel booking.");
        return;
      }

      const summary = payload.cancellation?.message || "Booking cancelled.";
      toast.success(summary);
      router.refresh();
    } catch {
      toast.error("Unable to cancel booking right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={handleCancelBooking}
      disabled={isSubmitting || !canCancel}
      size={compact ? "sm" : "default"}
    >
      {isSubmitting
        ? "Cancelling..."
        : bookingStatus === "cancelled"
          ? "Cancelled"
          : bookingStatus === "checked_in" || bookingStatus === "completed"
            ? "Cancellation Unavailable"
            : "Cancel Booking"}
    </Button>
  );
}
