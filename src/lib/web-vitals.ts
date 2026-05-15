/**
 * Web Vitals Tracking Utility
 * 
 * Monitors Core Web Vitals (LCP, FID, CLS, TTFB, INP) and sends
 * data to Vercel Analytics for Real User Monitoring (RUM).
 * 
 * Metrics tracked:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity (legacy)
 * - INP (Interaction to Next Paint): Interactivity (new standard)
 * - CLS (Cumulative Layout Shift): Visual stability  
 * - TTFB (Time to First Byte): Server response time
 */

import type { Metric } from 'web-vitals';

/**
 * Report Web Vitals to Vercel Analytics
 * Automatically integrates with @vercel/analytics
 */
export function reportWebVitals(metric: Metric): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    });
  }

  // Send to Vercel Analytics
  if (typeof window !== 'undefined' && window.va) {
    window.va('event', {
      name: `web-vitals-${metric.name.toLowerCase()}`,
      data: {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      },
    });
  }

  // You can also send to Google Analytics, Sentry, or custom endpoint
  // Example: sendToGoogleAnalytics(metric);
  // Example: sendToSentry(metric);
}

/**
 * Optional: Send to Google Analytics
 * Uncomment if using GA4
 */
// function sendToGoogleAnalytics(metric: Metric): void {
//   if (typeof window !== 'undefined' && window.gtag) {
//     window.gtag('event', metric.name, {
//       value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
//       metric_id: metric.id,
//       metric_value: metric.value,
//       metric_delta: metric.delta,
//     });
//   }
// }

/**
 * Core Web Vitals thresholds (Google standards)
 */
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // ms
  FID: { good: 100, needsImprovement: 300 }, // ms
  INP: { good: 200, needsImprovement: 500 }, // ms
  CLS: { good: 0.1, needsImprovement: 0.25 }, // score
  TTFB: { good: 800, needsImprovement: 1800 }, // ms
} as const;

/**
 * Get metric rating (good/needs-improvement/poor)
 */
export function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Declare global window types for analytics
 */
declare global {
  interface Window {
    va?: (event: string, data?: Record<string, any>) => void;
    gtag?: (command: string, ...args: any[]) => void;
  }
}
