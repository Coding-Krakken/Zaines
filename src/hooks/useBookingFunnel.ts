/**
 * Booking Funnel Analytics Hook
 * 
 * Tracks user progress through the booking funnel.
 * Automatically logs funnel steps and abandonment.
 * 
 * Usage:
 * const { trackStep, trackAbandonment } = useBookingFunnel();
 * trackStep(1, 'dates_selected', { service: 'boarding' });
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { trackEvent, trackBookingStep, type AnalyticsEventData } from '@/lib/analytics';

export interface BookingFunnelStep {
  step: number;
  name: string;
  timestamp: number;
  data?: AnalyticsEventData;
}

export function useBookingFunnel() {
  const funnelStartRef = useRef<number | null>(null);
  const currentStepRef = useRef<number>(0);
  const stepsCompletedRef = useRef<BookingFunnelStep[]>([]);

  /**
   * Track a booking funnel step
   */
  const trackStep = useCallback((
    step: number,
    stepName: string,
    eventData?: AnalyticsEventData
  ) => {
    // Initialize funnel start time on first step
    if (funnelStartRef.current === null) {
      funnelStartRef.current = Date.now();
    }

    const now = Date.now();
    const timeInFunnel = now - funnelStartRef.current;

    // Record step
    const stepData: BookingFunnelStep = {
      step,
      name: stepName,
      timestamp: now,
      data: eventData,
    };
    stepsCompletedRef.current.push(stepData);
    currentStepRef.current = step;

    // Track the event
    trackBookingStep(step, stepName, {
      ...eventData,
      timeInFunnel,
      previousStep: currentStepRef.current - 1,
    });
  }, []);

  /**
   * Track booking completion
   */
  const trackCompletion = useCallback((eventData?: AnalyticsEventData) => {
    if (funnelStartRef.current === null) return;

    const totalTime = Date.now() - funnelStartRef.current;
    const totalSteps = stepsCompletedRef.current.length;

    trackEvent('booking_completed', {
      ...eventData,
      totalTime,
      totalSteps,
      steps: stepsCompletedRef.current.map(s => s.name),
    });

    // Reset funnel
    funnelStartRef.current = null;
    currentStepRef.current = 0;
    stepsCompletedRef.current = [];
  }, []);

  /**
   * Track booking abandonment
   */
  const trackAbandonment = useCallback((reason?: string, eventData?: AnalyticsEventData) => {
    if (funnelStartRef.current === null) return;

    const totalTime = Date.now() - funnelStartRef.current;
    const lastStep = stepsCompletedRef.current[stepsCompletedRef.current.length - 1];

    trackEvent('booking_abandoned', {
      ...eventData,
      reason,
      abandonedAt: lastStep?.name,
      abandonedStep: currentStepRef.current,
      totalTime,
      stepsCompleted: stepsCompletedRef.current.length,
    });

    // Reset funnel
    funnelStartRef.current = null;
    currentStepRef.current = 0;
    stepsCompletedRef.current = [];
  }, []);

  /**
   * Track abandonment on page unload
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (funnelStartRef.current !== null && currentStepRef.current > 0) {
        trackAbandonment('page_exit');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [trackAbandonment]);

  return {
    trackStep,
    trackCompletion,
    trackAbandonment,
    // Note: currentStep tracked internally via ref (not exposed to avoid render issues)
  };
}

/**
 * Booking Funnel Steps (for reference)
 */
export const BOOKING_STEPS = {
  STARTED: { step: 1, name: 'booking_started' },
  DATES_SELECTED: { step: 2, name: 'dates_selected' },
  SUITE_SELECTED: { step: 3, name: 'suite_selected' },
  ACCOUNT_CREATED: { step: 4, name: 'account_created' },
  PET_ADDED: { step: 5, name: 'pet_added' },
  WAIVER_SIGNED: { step: 6, name: 'waiver_signed' },
  PAYMENT_INITIATED: { step: 7, name: 'payment_initiated' },
  COMPLETED: { step: 8, name: 'booking_completed' },
} as const;
