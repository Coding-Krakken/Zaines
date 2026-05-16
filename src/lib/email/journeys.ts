/**
 * Communication Journey Orchestration
 * 
 * Phase 7: AI & Automation - Automated email sequences for customer engagement
 * 
 * Features:
 * - Pre-arrival reminders
 * - During-stay updates
 * - Post-stay follow-up and review requests
 * - Win-back campaigns for lapsed customers
 * - Abandoned booking recovery
 */

import { addDays, subDays, differenceInDays } from "date-fns";

export type JourneyType = 
  | "pre_arrival"
  | "during_stay"
  | "post_stay"
  | "abandoned_booking"
  | "win_back"
  | "anniversary";

export interface JourneyStep {
  id: string;
  journeyType: JourneyType;
  delayDays: number; // Days relative to trigger event
  emailTemplate: string;
  subject: string;
  priority: "high" | "medium" | "low";
  enabled: boolean;
}

/**
 * Pre-Arrival Journey: Prepare customers for their upcoming stay
 */
export const PRE_ARRIVAL_JOURNEY: JourneyStep[] = [
  {
    id: "pre_arrival_7_days",
    journeyType: "pre_arrival",
    delayDays: -7, // 7 days before check-in
    emailTemplate: "pre-arrival-week",
    subject: "🐾 Your pup's playday is just a week away!",
    priority: "medium",
    enabled: true,
  },
  {
    id: "pre_arrival_2_days",
    journeyType: "pre_arrival",
    delayDays: -2, // 2 days before check-in
    emailTemplate: "pre-arrival-final",
    subject: "📋 Final prep checklist for {{petName}}'s stay",
    priority: "high",
    enabled: true,
  },
  {
    id: "pre_arrival_morning",
    journeyType: "pre_arrival",
    delayDays: 0, // Morning of check-in
    emailTemplate: "check-in-day",
    subject: "🎉 Today's the day! Check-in details inside",
    priority: "high",
    enabled: true,
  },
];

/**
 * During-Stay Journey: Keep parents informed during the stay
 */
export const DURING_STAY_JOURNEY: JourneyStep[] = [
  {
    id: "during_stay_day_1",
    journeyType: "during_stay",
    delayDays: 1, // 1 day after check-in
    emailTemplate: "first-day-update",
    subject: "💕 {{petName}} is having a blast! First day update",
    priority: "high",
    enabled: true,
  },
  {
    id: "during_stay_midpoint",
    journeyType: "during_stay",
    delayDays: 0, // Calculated based on stay length
    emailTemplate: "midstay-update",
    subject: "📸 Photo update: {{petName}}'s stay highlights",
    priority: "medium",
    enabled: true,
  },
];

/**
 * Post-Stay Journey: Follow-up and review requests
 */
export const POST_STAY_JOURNEY: JourneyStep[] = [
  {
    id: "post_stay_day_1",
    journeyType: "post_stay",
    delayDays: 1, // 1 day after checkout
    emailTemplate: "post-stay-thanks",
    subject: "Thank you for trusting us with {{petName}}! 🐕",
    priority: "medium",
    enabled: true,
  },
  {
    id: "post_stay_review_request",
    journeyType: "post_stay",
    delayDays: 3, // 3 days after checkout
    emailTemplate: "review-request",
    subject: "How was {{petName}}'s stay? We'd love your feedback ⭐",
    priority: "medium",
    enabled: true,
  },
  {
    id: "post_stay_rebook",
    journeyType: "post_stay",
    delayDays: 14, // 2 weeks after checkout
    emailTemplate: "rebook-offer",
    subject: "{{petName}} misses the pack! Book their next visit 🎉",
    priority: "low",
    enabled: true,
  },
];

/**
 * Abandoned Booking Journey: Recover incomplete bookings
 */
export const ABANDONED_BOOKING_JOURNEY: JourneyStep[] = [
  {
    id: "abandoned_1_hour",
    journeyType: "abandoned_booking",
    delayDays: 0, // 1 hour after abandonment (handled separately)
    emailTemplate: "booking-reminder-short",
    subject: "Don't lose your spot! Complete your booking for {{petName}}",
    priority: "high",
    enabled: true,
  },
  {
    id: "abandoned_24_hours",
    journeyType: "abandoned_booking",
    delayDays: 1,
    emailTemplate: "booking-reminder-long",
    subject: "Still interested? Your suite is waiting for {{petName}} 🐾",
    priority: "medium",
    enabled: true,
  },
  {
    id: "abandoned_final",
    journeyType: "abandoned_booking",
    delayDays: 3,
    emailTemplate: "booking-reminder-final",
    subject: "Last chance: Limited availability for {{dates}}",
    priority: "low",
    enabled: true,
  },
];

/**
 * Win-Back Journey: Re-engage inactive customers
 */
export const WIN_BACK_JOURNEY: JourneyStep[] = [
  {
    id: "win_back_60_days",
    journeyType: "win_back",
    delayDays: 60, // 60 days since last booking
    emailTemplate: "we-miss-you",
    subject: "We miss {{petName}}! 💙 Special offer inside",
    priority: "medium",
    enabled: true,
  },
  {
    id: "win_back_90_days",
    journeyType: "win_back",
    delayDays: 90, // 90 days since last booking
    emailTemplate: "win-back-offer",
    subject: "Come back to the pack! 20% off {{petName}}'s next stay",
    priority: "medium",
    enabled: true,
  },
];

/**
 * Anniversary Journey: Celebrate customer milestones
 */
export const ANNIVERSARY_JOURNEY: JourneyStep[] = [
  {
    id: "first_booking_anniversary",
    journeyType: "anniversary",
    delayDays: 365, // 1 year after first booking
    emailTemplate: "anniversary-celebration",
    subject: "🎂 Happy 1-year anniversary with {{petName}}!",
    priority: "medium",
    enabled: true,
  },
];

/**
 * Calculate which journey steps should be sent for a booking
 */
export function calculateJourneySteps(params: {
  checkInDate: Date;
  checkOutDate: Date;
  bookingCreatedAt: Date;
  currentDate?: Date;
}): Array<{ step: JourneyStep; sendAt: Date }> {
  const { checkInDate, checkOutDate, bookingCreatedAt, currentDate = new Date() } = params;
  const stayLength = differenceInDays(checkOutDate, checkInDate);
  const scheduledSteps: Array<{ step: JourneyStep; sendAt: Date }> = [];

  // Pre-arrival journey
  PRE_ARRIVAL_JOURNEY.forEach((step) => {
    if (step.enabled) {
      const sendAt = addDays(checkInDate, step.delayDays);
      if (sendAt > currentDate) {
        scheduledSteps.push({ step, sendAt });
      }
    }
  });

  // During-stay journey
  DURING_STAY_JOURNEY.forEach((step) => {
    if (step.enabled) {
      let sendAt: Date;
      
      if (step.id === "during_stay_midpoint") {
        // Send midpoint update halfway through the stay
        const midpoint = Math.floor(stayLength / 2);
        sendAt = addDays(checkInDate, midpoint);
      } else {
        sendAt = addDays(checkInDate, step.delayDays);
      }
      
      if (sendAt > currentDate && sendAt < checkOutDate) {
        scheduledSteps.push({ step, sendAt });
      }
    }
  });

  // Post-stay journey
  POST_STAY_JOURNEY.forEach((step) => {
    if (step.enabled) {
      const sendAt = addDays(checkOutDate, step.delayDays);
      if (sendAt > currentDate) {
        scheduledSteps.push({ step, sendAt });
      }
    }
  });

  return scheduledSteps.sort((a, b) => a.sendAt.getTime() - b.sendAt.getTime());
}

/**
 * Check if a customer should receive win-back campaign
 */
export function shouldSendWinBack(params: {
  lastBookingDate: Date;
  currentDate?: Date;
}): { shouldSend: boolean; step?: JourneyStep } {
  const { lastBookingDate, currentDate = new Date() } = params;
  const daysSinceLastBooking = differenceInDays(currentDate, lastBookingDate);

  for (const step of WIN_BACK_JOURNEY) {
    if (step.enabled && daysSinceLastBooking >= step.delayDays) {
      // Check if already sent (would need database check in real implementation)
      return { shouldSend: true, step };
    }
  }

  return { shouldSend: false };
}

/**
 * Get email template context for personalization
 */
export function getEmailContext(params: {
  customerName: string;
  petName: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  bookingNumber?: string;
  suiteType?: string;
}): Record<string, string> {
  const { customerName, petName, checkInDate, checkOutDate, bookingNumber, suiteType } = params;

  return {
    customerName,
    petName,
    checkInDate: checkInDate?.toLocaleDateString() || "",
    checkOutDate: checkOutDate?.toLocaleDateString() || "",
    dates: checkInDate && checkOutDate 
      ? `${checkInDate.toLocaleDateString()} - ${checkOutDate.toLocaleDateString()}`
      : "",
    bookingNumber: bookingNumber || "",
    suiteType: suiteType || "suite",
  };
}
