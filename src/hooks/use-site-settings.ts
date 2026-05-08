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
