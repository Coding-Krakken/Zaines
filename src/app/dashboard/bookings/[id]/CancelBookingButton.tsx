"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();

  const handleCancelBooking = async () => {
    if (!canCancel) {
      toast.error("This booking cannot be cancelled in its current state.");
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
      setShowConfirmDialog(false);
      router.refresh();
    } catch {
      toast.error("Unable to cancel booking right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        onClick={() => setShowConfirmDialog(true)}
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

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking?</DialogTitle>
            <DialogDescription>
              Cancellation terms and refund policy will be applied based on your stay dates.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Keep Booking
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
