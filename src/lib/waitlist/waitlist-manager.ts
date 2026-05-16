/**
 * Waitlist Management System
 * 
 * Phase 7: AI & Automation - Intelligent waitlist for fully booked dates
 * 
 * Features:
 * - Add customers to waitlist for specific dates
 * - Priority ordering (loyalty tier, timestamp)
 * - Automatic notification on cancellation
 * - Conversion tracking (waitlist → booking)
 */

import { addHours } from "date-fns";

export type WaitlistPriority = "high" | "medium" | "low";

export interface WaitlistEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  petName: string;
  requestedCheckIn: Date;
  requestedCheckOut: Date;
  suiteType: "standard" | "deluxe" | "luxury" | "any";
  priority: WaitlistPriority;
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum";
  createdAt: Date;
  expiresAt: Date; // Auto-expire after X days
  notified: boolean;
  convertedToBooking: boolean;
}

/**
 * Calculate waitlist priority based on loyalty tier and urgency
 */
export function calculateWaitlistPriority(params: {
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum";
  isReturningCustomer: boolean;
  daysUntilCheckIn: number;
}): WaitlistPriority {
  const { loyaltyTier, isReturningCustomer, daysUntilCheckIn } = params;

  // Platinum/Gold = always high priority
  if (loyaltyTier === "platinum" || loyaltyTier === "gold") {
    return "high";
  }

  // Silver + returning customer = high priority
  if (loyaltyTier === "silver" && isReturningCustomer) {
    return "high";
  }

  // Urgent booking (< 7 days) = medium priority
  if (daysUntilCheckIn < 7) {
    return "medium";
  }

  return "low";
}

/**
 * Sort waitlist entries by priority and timestamp
 */
export function sortWaitlistEntries(entries: WaitlistEntry[]): WaitlistEntry[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  
  return [...entries].sort((a, b) => {
    // First sort by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by loyalty tier (platinum > gold > silver > bronze)
    const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
    const tierDiff = tierOrder[a.loyaltyTier] - tierOrder[b.loyaltyTier];
    if (tierDiff !== 0) return tierDiff;
    
    // Finally by timestamp (first come, first served)
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

/**
 * Find matching waitlist entries for a cancellation
 */
export function findMatchingWaitlistEntries(params: {
  cancelledCheckIn: Date;
  cancelledCheckOut: Date;
  cancelledSuiteType: "standard" | "deluxe" | "luxury";
  allWaitlistEntries: WaitlistEntry[];
}): WaitlistEntry[] {
  const { cancelledCheckIn, cancelledCheckOut, cancelledSuiteType, allWaitlistEntries } = params;

  const matches = allWaitlistEntries.filter((entry) => {
    // Skip if already notified or converted
    if (entry.notified || entry.convertedToBooking) return false;
    
    // Skip if expired
    if (entry.expiresAt < new Date()) return false;
    
    // Check date overlap
    const requestedStart = entry.requestedCheckIn.getTime();
    const requestedEnd = entry.requestedCheckOut.getTime();
    const cancelledStart = cancelledCheckIn.getTime();
    const cancelledEnd = cancelledCheckOut.getTime();
    
    const hasDateOverlap = requestedStart < cancelledEnd && requestedEnd > cancelledStart;
    
    if (!hasDateOverlap) return false;
    
    // Check suite type match
    if (entry.suiteType === "any") return true;
    if (entry.suiteType === cancelledSuiteType) return true;
    
    // Allow upgrade (e.g., waitlist for standard can take deluxe/luxury)
    const suiteTypeOrder = { standard: 0, deluxe: 1, luxury: 2 };
    if (suiteTypeOrder[entry.suiteType] < suiteTypeOrder[cancelledSuiteType]) {
      return true;
    }
    
    return false;
  });

  return sortWaitlistEntries(matches);
}

/**
 * Generate waitlist notification email context
 */
export function getWaitlistNotificationContext(params: {
  entry: WaitlistEntry;
  availableCheckIn: Date;
  availableCheckOut: Date;
  suiteType: string;
  reservationLink: string;
}): {
  subject: string;
  context: Record<string, string>;
  expiresInHours: number;
} {
  const { entry, availableCheckIn, availableCheckOut, suiteType, reservationLink } = params;

  // Reservation expires in 24 hours for high priority, 12 hours otherwise
  const expiresInHours = entry.priority === "high" ? 24 : 12;
  const expiresAt = addHours(new Date(), expiresInHours);

  return {
    subject: `🎉 Great news! A ${suiteType} suite just opened up for ${entry.petName}`,
    context: {
      userName: entry.userName,
      petName: entry.petName,
      checkInDate: availableCheckIn.toLocaleDateString(),
      checkOutDate: availableCheckOut.toLocaleDateString(),
      suiteType,
      reservationLink,
      expiresAt: expiresAt.toLocaleString(),
      expiresInHours: expiresInHours.toString(),
    },
    expiresInHours,
  };
}

/**
 * Calculate waitlist metrics for analytics
 */
export function calculateWaitlistMetrics(params: {
  entries: WaitlistEntry[];
}): {
  totalActive: number;
  byPriority: Record<WaitlistPriority, number>;
  byTier: Record<string, number>;
  conversionRate: number;
  averageWaitDays: number;
} {
  const { entries } = params;
  
  const activeEntries = entries.filter(
    (e) => !e.convertedToBooking && e.expiresAt > new Date()
  );
  
  const byPriority: Record<WaitlistPriority, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };
  
  const byTier: Record<string, number> = {
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0,
  };
  
  activeEntries.forEach((entry) => {
    byPriority[entry.priority]++;
    byTier[entry.loyaltyTier]++;
  });
  
  const converted = entries.filter((e) => e.convertedToBooking).length;
  const conversionRate = entries.length > 0 ? (converted / entries.length) * 100 : 0;
  
  const totalWaitDays = entries
    .filter((e) => e.convertedToBooking)
    .reduce((sum, entry) => {
      const waitDays = Math.ceil(
        (entry.requestedCheckIn.getTime() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + waitDays;
    }, 0);
  
  const averageWaitDays = converted > 0 ? totalWaitDays / converted : 0;
  
  return {
    totalActive: activeEntries.length,
    byPriority,
    byTier,
    conversionRate: Math.round(conversionRate * 10) / 10,
    averageWaitDays: Math.round(averageWaitDays * 10) / 10,
  };
}
