/**
 * useSiteSettings Hook
 * Replaces static siteConfig with dynamic, real-time settings
 * Use this instead of importing siteConfig directly
 */

'use client';

import { useSettings } from '@/providers/settings-provider';
import type { AdminSettings } from '@/types/admin';

interface SiteContactInfo {
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface SiteSettingsHookReturn {
  contactInfo: SiteContactInfo;
  businessHours: AdminSettings['businessHours'];
  businessName: string;
  socialLinks: AdminSettings['businessProfileSettings']['socialLinks'];
  websiteProfile: AdminSettings['websiteProfileSettings'];
  trustCopy: AdminSettings['trustCopySettings'];
  isLoading: boolean;
}

/**
 * Hook to get current site settings from the database
 * Automatically updates across all components when settings change
 */
export function useSiteSettings(): SiteSettingsHookReturn {
  const { settings, isLoading } = useSettings();

  return {
    contactInfo: {
      phone: settings?.contactPhone || '(315) 657-1332',
      email: settings?.contactEmail || 'jgibbs@zainesstayandplay.com',
      address: settings?.address || '123 Pet Paradise Lane',
      city: settings?.city || 'Syracuse',
      state: settings?.state || 'NY',
      zip: settings?.zip || '13202',
    },
    businessHours: settings?.businessHours || {
      monday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
      tuesday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
      wednesday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
      thursday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
      friday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
      saturday: { openTime: '08:00', closeTime: '18:00', isClosed: false },
      sunday: { openTime: '08:00', closeTime: '18:00', isClosed: false },
    },
    businessName: settings?.businessProfileSettings.businessName || "Zaine's Stay & Play",
    socialLinks: settings?.businessProfileSettings.socialLinks || {
      facebook:
        'https://www.facebook.com/people/Zaines-Stay-Play/61550036005682/',
      instagram: 'https://instagram.com/zainesstayandplay',
      twitter: 'https://twitter.com/zainesstayandplay',
    },
    websiteProfile: settings?.websiteProfileSettings || {
      siteUrl: 'https://zainesstayandplay.com',
      siteDescription:
        'Private, small-capacity dog boarding in Syracuse with owner-on-site care, three suites, and safety-first updates.',
      ogImageUrl: 'https://zainesstayandplay.com/og.jpg',
      serviceArea: [
        'Syracuse',
        'Liverpool',
        'Cicero',
        'Baldwinsville',
        'Fayetteville',
        'Manlius',
        'Clay',
        'North Syracuse',
      ],
    },
    trustCopy: settings?.trustCopySettings || {
      pricingDisclosure:
        'Premium but fair pricing includes clear subtotal, applicable tax, selected care items, and total shown before confirmation. No hidden fees, no surprise add-ons, or other undisclosed charges are introduced at checkout.',
      cancellationProcessing:
        'Refunds are returned to the original payment method when payment processing is available.',
      privacySecurityDisclosure:
        "Payment details are processed by Stripe; Zaine's Stay & Play does not store card numbers on our servers. We use access controls and secure transmission for booking, account, pet health, and message data.",
      trustEvidenceClaim:
        'Only 3 private suites, owner onsite, camera-monitored safety, no harsh chemicals, and same-family dogs can stay together when approved.',
    },
    isLoading,
  };
}

/**
 * Get the full address string formatted
 */
export function useFormattedAddress(): string {
  const { contactInfo } = useSiteSettings();
  return `${contactInfo.address}, ${contactInfo.city}, ${contactInfo.state} ${contactInfo.zip}`;
}
