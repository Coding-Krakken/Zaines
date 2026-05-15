/**
 * Analytics Tracking Utility
 * 
 * Centralized event tracking for Vercel Analytics and Google Analytics.
 * Tracks user behavior for conversion optimization and A/B testing.
 * 
 * Usage:
 * import { trackEvent } from '@/lib/analytics';
 * trackEvent('booking_started', { service: 'boarding', nights: 2 });
 */

// Analytics event types for type safety
export type AnalyticsEvent =
  // Booking funnel events
  | 'booking_started'
  | 'booking_dates_selected'
  | 'booking_suite_selected'
  | 'booking_account_created'
  | 'booking_pet_added'
  | 'booking_waiver_signed'
  | 'booking_payment_initiated'
  | 'booking_completed'
  | 'booking_abandoned'
  // Engagement events
  | 'service_viewed'
  | 'contact_form_submitted'
  | 'phone_clicked'
  | 'email_clicked'
  | 'gallery_opened'
  | 'review_read'
  | 'faq_opened'
  // Navigation events
  | 'cta_clicked'
  | 'navigation_clicked'
  | 'footer_link_clicked';

export interface AnalyticsEventData {
  // Booking-related properties
  service?: string;
  suiteType?: string;
  nights?: number;
  petCount?: number;
  subtotal?: number;
  total?: number;
  isGuest?: boolean;
  hasAccount?: boolean;
  
  // Engagement properties
  pagePath?: string;
  ctaText?: string;
  linkUrl?: string;
  serviceName?: string;
  
  // A/B testing properties
  variant?: string;
  experimentId?: string;
  
  // Generic properties
  [key: string]: any;
}

/**
 * Track an analytics event
 * Sends to both Vercel Analytics and Google Analytics (if configured)
 */
export function trackEvent(
  eventName: AnalyticsEvent,
  eventData?: AnalyticsEventData
): void {
  // Only track in browser
  if (typeof window === 'undefined') return;

  // Clean event data (remove undefined values)
  const cleanData = eventData
    ? Object.fromEntries(
        Object.entries(eventData).filter(([_, v]) => v !== undefined)
      )
    : {};

  // Send to Vercel Analytics
  if (window.va) {
    window.va('event', { name: eventName, data: cleanData });
  }

  // Send to Google Analytics (if configured)
  if (window.gtag) {
    window.gtag('event', eventName, cleanData);
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, cleanData);
  }
}

/**
 * Track a page view
 * Automatically called by Next.js router
 */
export function trackPageView(url: string): void {
  if (typeof window === 'undefined') return;

  // Vercel Analytics tracks page views automatically
  // Only need explicit tracking for Google Analytics
  if (window.gtag) {
    window.gtag('config', window.GA_MEASUREMENT_ID || '', {
      page_path: url,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Page view:', url);
  }
}

/**
 * Track a conversion event with revenue
 * Used for e-commerce tracking
 */
export function trackConversion(
  eventName: string,
  revenue: number,
  eventData?: AnalyticsEventData
): void {
  trackEvent(eventName as AnalyticsEvent, {
    ...eventData,
    value: revenue,
    currency: 'USD',
  });

  // Enhanced e-commerce tracking for Google Analytics
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: eventData?.bookingNumber || Date.now().toString(),
      value: revenue,
      currency: 'USD',
      items: eventData?.items || [],
    });
  }
}

/**
 * Track booking funnel step
 * Automatically adds funnel metadata
 */
export function trackBookingStep(
  step: number,
  stepName: string,
  eventData?: AnalyticsEventData
): void {
  trackEvent('booking_started' as AnalyticsEvent, {
    ...eventData,
    funnelStep: step,
    funnelStepName: stepName,
  });
}

/**
 * Track user interaction
 * Generic helper for clicks, form submissions, etc.
 */
export function trackInteraction(
  interactionType: string,
  target: string,
  eventData?: AnalyticsEventData
): void {
  trackEvent(interactionType as AnalyticsEvent, {
    ...eventData,
    target,
    timestamp: Date.now(),
  });
}

/**
 * Track experiment exposure
 * Used for A/B testing analytics
 */
export function trackExperiment(
  experimentId: string,
  variant: string,
  eventData?: AnalyticsEventData
): void {
  if (typeof window === 'undefined') return;

  // Send to Vercel Analytics
  if (window.va) {
    window.va('event', {
      name: 'experiment_exposed',
      data: {
        experimentId,
        variant,
        ...eventData,
      },
    });
  }

  // Store variant in sessionStorage for consistent tracking
  try {
    sessionStorage.setItem(`experiment_${experimentId}`, variant);
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Get experiment variant from sessionStorage
 */
export function getExperimentVariant(experimentId: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return sessionStorage.getItem(`experiment_${experimentId}`);
  } catch (e) {
    return null;
  }
}

// Declare global window types
declare global {
  interface Window {
    va?: (event: string, data?: Record<string, any>) => void;
    gtag?: (command: string, ...args: any[]) => void;
    GA_MEASUREMENT_ID?: string;
  }
}
