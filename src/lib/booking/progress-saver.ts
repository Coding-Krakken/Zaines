/**
 * Booking Progress Auto-Save Utility
 * 
 * Automatically saves booking wizard progress to localStorage to prevent data loss
 * and enable progress recovery for abandoned bookings.
 * 
 * Phase 5: Booking UX Refinement
 */

import type {
  StepDatesData,
  StepSuitesData,
  StepAccountData,
  StepPetsData,
  StepWaiverData,
  StepPaymentData,
} from "@/lib/validations/booking-wizard";

export interface WizardData {
  dates?: StepDatesData;
  suites?: StepSuitesData;
  account?: StepAccountData;
  pets?: StepPetsData;
  waiver?: StepWaiverData;
  payment?: StepPaymentData & {
    bookingId?: string;
    clientSecret?: string;
    paymentMode?: "payment_element" | "embedded_checkout";
    pricingDisclosureAccepted?: boolean;
  };
}

const STORAGE_KEY_PREFIX = "booking_progress_";
const PROGRESS_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SavedProgress {
  wizardData: WizardData;
  currentStep: string;
  savedAt: number;
  expiresAt: number;
}

/**
 * Save booking progress to localStorage with expiration timestamp
 */
export function saveBookingProgress(
  wizardData: WizardData,
  currentStep: string,
  sessionId?: string
): void {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${sessionId || "default"}`;
    const savedAt = Date.now();
    const expiresAt = savedAt + PROGRESS_EXPIRY_MS;

    const progress: SavedProgress = {
      wizardData,
      currentStep,
      savedAt,
      expiresAt,
    };

    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch (error) {
    // Silently fail if localStorage is unavailable (e.g., private browsing)
    console.warn("Failed to save booking progress:", error);
  }
}

/**
 * Retrieve saved booking progress if not expired
 */
export function loadBookingProgress(
  sessionId?: string
): SavedProgress | null {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${sessionId || "default"}`;
    const saved = localStorage.getItem(storageKey);

    if (!saved) {
      return null;
    }

    const progress: SavedProgress = JSON.parse(saved);

    // Check if expired
    if (Date.now() > progress.expiresAt) {
      localStorage.removeItem(storageKey);
      return null;
    }

    return progress;
  } catch (error) {
    console.warn("Failed to load booking progress:", error);
    return null;
  }
}

/**
 * Clear saved booking progress
 */
export function clearBookingProgress(sessionId?: string): void {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${sessionId || "default"}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn("Failed to clear booking progress:", error);
  }
}

/**
 * Get time remaining until progress expires (in minutes)
 */
export function getProgressTimeRemaining(sessionId?: string): number | null {
  const progress = loadBookingProgress(sessionId);
  
  if (!progress) {
    return null;
  }

  const remainingMs = progress.expiresAt - Date.now();
  return Math.max(0, Math.floor(remainingMs / (60 * 1000)));
}
