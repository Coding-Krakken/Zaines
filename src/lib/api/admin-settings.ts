/**
 * Admin Settings API - Server-side helpers for admin settings management
 * Handles reading/writing settings stored in the Settings table
 */

import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import type {
  AdminSettings,
  BusinessHours,
  AvailabilityRules,
  PricingSettings,
  CancellationPolicySettings,
  BusinessProfileSettings,
  WebsiteProfileSettings,
} from '@/types/admin';
import { siteConfig } from '@/config/site';

const SETTINGS_KEYS: Record<string, string> = {
  AUTO_CONFIRM_BOOKINGS: 'admin.auto_confirm_bookings',
  PHOTO_NOTIFICATION_TYPE: 'admin.photo_notification_type',
  PHOTO_NOTIFICATION_TIME: 'admin.photo_notification_time',
  DASHBOARD_DATE_RANGE: 'admin.dashboard_date_range',
  // Phase 1: Business Hours & Contact Info
  BUSINESS_HOURS: 'admin.business_hours', // JSON string
  CONTACT_PHONE: 'admin.contact_phone',
  CONTACT_EMAIL: 'admin.contact_email',
  ADDRESS: 'admin.address',
  CITY: 'admin.city',
  STATE: 'admin.state',
  ZIP: 'admin.zip',
  // Phase 3: Availability & Scheduling Rules
  AVAILABILITY_RULES: 'admin.availability_rules', // JSON string
  // Phase 4: Blackout Dates & Seasonal Pricing
  BLACKOUT_DATES: 'admin.blackout_dates', // JSON array
  SEASONAL_PRICING_RULES: 'admin.seasonal_pricing_rules', // JSON array
  // Phase 5: Pricing & Fees Configuration
  PRICING_SETTINGS: 'admin.pricing_settings', // JSON object
  // Phase 6: Cancellation Policy Configuration
  CANCELLATION_POLICY_SETTINGS: 'admin.cancellation_policy_settings', // JSON object
  // Phase 7: Business Profile & Social Links
  BUSINESS_PROFILE_SETTINGS: 'admin.business_profile_settings', // JSON object
  // Phase 8: Website Profile & Service Area
  WEBSITE_PROFILE_SETTINGS: 'admin.website_profile_settings', // JSON object
};

/**
 * Get all admin settings with defaults
 */
export async function getAdminSettings(): Promise<AdminSettings> {
  if (!isDatabaseConfigured()) {
    return getDefaultSettings();
  }

  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: Object.values(SETTINGS_KEYS),
        },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    // Parse business hours from JSON
    let businessHours: BusinessHours;
    try {
      const hoursJson = settingsMap.get(SETTINGS_KEYS.BUSINESS_HOURS);
      businessHours = hoursJson ? JSON.parse(hoursJson) : getDefaultBusinessHours();
    } catch {
      businessHours = getDefaultBusinessHours();
    }

    return {
      autoConfirmBookings:
        settingsMap.get(SETTINGS_KEYS.AUTO_CONFIRM_BOOKINGS) === 'true',
      photoNotificationType: (settingsMap.get(SETTINGS_KEYS.PHOTO_NOTIFICATION_TYPE) ||
        'instant') as 'instant' | 'daily_batch',
      photoNotificationTime: settingsMap.get(SETTINGS_KEYS.PHOTO_NOTIFICATION_TIME),
      dashboardDateRange: (settingsMap.get(SETTINGS_KEYS.DASHBOARD_DATE_RANGE) ||
        'today') as 'today' | 'today_tomorrow' | 'this_week',
      // Phase 1: Business Hours & Contact Info
      businessHours,
      contactPhone: settingsMap.get(SETTINGS_KEYS.CONTACT_PHONE) || '(315) 657-1332',
      contactEmail: settingsMap.get(SETTINGS_KEYS.CONTACT_EMAIL) || 'jgibbs@zainesstayandplay.com',
      address: settingsMap.get(SETTINGS_KEYS.ADDRESS) || '123 Pet Paradise Lane',
      city: settingsMap.get(SETTINGS_KEYS.CITY) || 'Syracuse',
      state: settingsMap.get(SETTINGS_KEYS.STATE) || 'NY',
      zip: settingsMap.get(SETTINGS_KEYS.ZIP) || '13202',
      // Phase 3: Availability & Scheduling Rules
      availabilityRules: (() => {
        try {
          const rulesJson = settingsMap.get(SETTINGS_KEYS.AVAILABILITY_RULES);
          return rulesJson ? JSON.parse(rulesJson) : getDefaultAvailabilityRules();
        } catch {
          return getDefaultAvailabilityRules();
        }
      })(),
      // Phase 4: Blackout Dates & Seasonal Pricing
      blackoutDates: (() => {
        try {
          const json = settingsMap.get(SETTINGS_KEYS.BLACKOUT_DATES);
          return json ? JSON.parse(json) : [];
        } catch {
          return [];
        }
      })(),
      seasonalPricingRules: (() => {
        try {
          const json = settingsMap.get(SETTINGS_KEYS.SEASONAL_PRICING_RULES);
          return json ? JSON.parse(json) : [];
        } catch {
          return [];
        }
      })(),
      // Phase 5: Pricing & Fees Configuration
      pricingSettings: (() => {
        try {
          const json = settingsMap.get(SETTINGS_KEYS.PRICING_SETTINGS);
          return json ? JSON.parse(json) : getDefaultPricingSettings();
        } catch {
          return getDefaultPricingSettings();
        }
      })(),
      // Phase 6: Cancellation Policy Configuration
      cancellationPolicySettings: (() => {
        try {
          const json = settingsMap.get(SETTINGS_KEYS.CANCELLATION_POLICY_SETTINGS);
          return json ? JSON.parse(json) : getDefaultCancellationPolicySettings();
        } catch {
          return getDefaultCancellationPolicySettings();
        }
      })(),
      // Phase 7: Business Profile & Social Links
      businessProfileSettings: (() => {
        try {
          const json = settingsMap.get(SETTINGS_KEYS.BUSINESS_PROFILE_SETTINGS);
          return json ? JSON.parse(json) : getDefaultBusinessProfileSettings();
        } catch {
          return getDefaultBusinessProfileSettings();
        }
      })(),
      // Phase 8: Website Profile & Service Area
      websiteProfileSettings: (() => {
        try {
          const json = settingsMap.get(SETTINGS_KEYS.WEBSITE_PROFILE_SETTINGS);
          return json ? JSON.parse(json) : getDefaultWebsiteProfileSettings();
        } catch {
          return getDefaultWebsiteProfileSettings();
        }
      })(),
    };
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Get a single setting value
 */
export async function getAdminSetting(key: keyof typeof SETTINGS_KEYS): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const setting = await prisma.settings.findUnique({
      where: { key: SETTINGS_KEYS[key] },
    });

    return setting?.value ?? null;
  } catch (error) {
    console.error('Error fetching setting:', error);
    return null;
  }
}

/**
 * Update admin settings
 */
export async function updateAdminSettings(updates: Partial<AdminSettings>): Promise<AdminSettings> {
  if (!isDatabaseConfigured()) {
    return getDefaultSettings();
  }

  try {
    const updatePromises: Promise<unknown>[] = [];

    if (updates.autoConfirmBookings !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.AUTO_CONFIRM_BOOKINGS },
          update: { value: String(updates.autoConfirmBookings) },
          create: {
            key: SETTINGS_KEYS.AUTO_CONFIRM_BOOKINGS,
            value: String(updates.autoConfirmBookings),
          },
        }),
      );
    }

    if (updates.photoNotificationType !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.PHOTO_NOTIFICATION_TYPE },
          update: { value: updates.photoNotificationType },
          create: {
            key: SETTINGS_KEYS.PHOTO_NOTIFICATION_TYPE,
            value: updates.photoNotificationType,
          },
        }),
      );
    }

    if (updates.photoNotificationTime !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.PHOTO_NOTIFICATION_TIME },
          update: { value: updates.photoNotificationTime },
          create: {
            key: SETTINGS_KEYS.PHOTO_NOTIFICATION_TIME,
            value: updates.photoNotificationTime,
          },
        }),
      );
    }

    if (updates.dashboardDateRange !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.DASHBOARD_DATE_RANGE },
          update: { value: updates.dashboardDateRange },
          create: {
            key: SETTINGS_KEYS.DASHBOARD_DATE_RANGE,
            value: updates.dashboardDateRange,
          },
        }),
      );
    }

    // Phase 1: Business Hours & Contact Info
    if (updates.businessHours !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.BUSINESS_HOURS },
          update: { value: JSON.stringify(updates.businessHours) },
          create: {
            key: SETTINGS_KEYS.BUSINESS_HOURS,
            value: JSON.stringify(updates.businessHours),
          },
        }),
      );
    }

    if (updates.contactPhone !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.CONTACT_PHONE },
          update: { value: updates.contactPhone },
          create: {
            key: SETTINGS_KEYS.CONTACT_PHONE,
            value: updates.contactPhone,
          },
        }),
      );
    }

    if (updates.contactEmail !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.CONTACT_EMAIL },
          update: { value: updates.contactEmail },
          create: {
            key: SETTINGS_KEYS.CONTACT_EMAIL,
            value: updates.contactEmail,
          },
        }),
      );
    }

    if (updates.address !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.ADDRESS },
          update: { value: updates.address },
          create: {
            key: SETTINGS_KEYS.ADDRESS,
            value: updates.address,
          },
        }),
      );
    }

    if (updates.city !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.CITY },
          update: { value: updates.city },
          create: {
            key: SETTINGS_KEYS.CITY,
            value: updates.city,
          },
        }),
      );
    }

    if (updates.state !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.STATE },
          update: { value: updates.state },
          create: {
            key: SETTINGS_KEYS.STATE,
            value: updates.state,
          },
        }),
      );
    }

    if (updates.zip !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.ZIP },
          update: { value: updates.zip },
          create: {
            key: SETTINGS_KEYS.ZIP,
            value: updates.zip,
          },
        }),
      );
    }

    // Phase 3: Availability & Scheduling Rules
    if (updates.availabilityRules !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.AVAILABILITY_RULES },
          update: { value: JSON.stringify(updates.availabilityRules) },
          create: {
            key: SETTINGS_KEYS.AVAILABILITY_RULES,
            value: JSON.stringify(updates.availabilityRules),
          },
        }),
      );
    }

    // Phase 4: Blackout Dates & Seasonal Pricing
    if (updates.blackoutDates !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.BLACKOUT_DATES },
          update: { value: JSON.stringify(updates.blackoutDates) },
          create: {
            key: SETTINGS_KEYS.BLACKOUT_DATES,
            value: JSON.stringify(updates.blackoutDates),
          },
        }),
      );
    }

    if (updates.seasonalPricingRules !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.SEASONAL_PRICING_RULES },
          update: { value: JSON.stringify(updates.seasonalPricingRules) },
          create: {
            key: SETTINGS_KEYS.SEASONAL_PRICING_RULES,
            value: JSON.stringify(updates.seasonalPricingRules),
          },
        }),
      );
    }

    // Phase 5: Pricing & Fees Configuration
    if (updates.pricingSettings !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.PRICING_SETTINGS },
          update: { value: JSON.stringify(updates.pricingSettings) },
          create: {
            key: SETTINGS_KEYS.PRICING_SETTINGS,
            value: JSON.stringify(updates.pricingSettings),
          },
        }),
      );
    }

    // Phase 6: Cancellation Policy Configuration
    if (updates.cancellationPolicySettings !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.CANCELLATION_POLICY_SETTINGS },
          update: { value: JSON.stringify(updates.cancellationPolicySettings) },
          create: {
            key: SETTINGS_KEYS.CANCELLATION_POLICY_SETTINGS,
            value: JSON.stringify(updates.cancellationPolicySettings),
          },
        }),
      );
    }

    // Phase 7: Business Profile & Social Links
    if (updates.businessProfileSettings !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.BUSINESS_PROFILE_SETTINGS },
          update: { value: JSON.stringify(updates.businessProfileSettings) },
          create: {
            key: SETTINGS_KEYS.BUSINESS_PROFILE_SETTINGS,
            value: JSON.stringify(updates.businessProfileSettings),
          },
        }),
      );
    }

    // Phase 8: Website Profile & Service Area
    if (updates.websiteProfileSettings !== undefined) {
      updatePromises.push(
        prisma.settings.upsert({
          where: { key: SETTINGS_KEYS.WEBSITE_PROFILE_SETTINGS },
          update: { value: JSON.stringify(updates.websiteProfileSettings) },
          create: {
            key: SETTINGS_KEYS.WEBSITE_PROFILE_SETTINGS,
            value: JSON.stringify(updates.websiteProfileSettings),
          },
        }),
      );
    }

    await Promise.all(updatePromises);

    // Return updated settings
    return getAdminSettings();
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return getAdminSettings();
  }
}

/**
 * Get default business hours (Mon-Fri 6am-8pm, Sat-Sun 8am-6pm, all open)
 */
function getDefaultBusinessHours(): BusinessHours {
  return {
    monday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
    tuesday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
    wednesday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
    thursday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
    friday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
    saturday: { openTime: '08:00', closeTime: '18:00', isClosed: false },
    sunday: { openTime: '08:00', closeTime: '18:00', isClosed: false },
  };
}

/**
 * Get default availability rules
 */
function getDefaultAvailabilityRules(): AvailabilityRules {
  return {
    minNightsPerBooking: 1,
    maxNightsPerBooking: 365,
    advanceBookingWindowDays: 365, // Allow booking up to 1 year ahead
    minimumLeadTimeDays: 0, // Allow same-day bookings
  };
}

/**
 * Get default pricing settings
 */
function getDefaultPricingSettings(): PricingSettings {
  return {
    currency: 'USD',
    standardNightlyRate: 65,
    deluxeNightlyRate: 85,
    luxuryNightlyRate: 120,
    taxRatePercent: 10,
    twoPetDiscountPercent: 15,
    threePlusPetsDiscountPercent: 20,
  };
}

/**
 * Get default cancellation policy settings
 */
function getDefaultCancellationPolicySettings(): CancellationPolicySettings {
  return {
    fullRefundHours: 48,
    partialRefundHours: 24,
    partialRefundPercent: 50,
    noShowRefundPercent: 0,
  };
}

/**
 * Get default business profile settings
 */
function getDefaultBusinessProfileSettings(): BusinessProfileSettings {
  return {
    businessName: siteConfig.name,
    socialLinks: {
      facebook: siteConfig.links.facebook,
      instagram: siteConfig.links.instagram,
      twitter: siteConfig.links.twitter,
    },
  };
}

/**
 * Get default website profile settings
 */
function getDefaultWebsiteProfileSettings(): WebsiteProfileSettings {
  return {
    siteUrl: siteConfig.url,
    siteDescription: siteConfig.description,
    ogImageUrl: siteConfig.ogImage,
    serviceArea: [...siteConfig.serviceArea],
  };
}

/**
 * Get default admin settings
 */
export function getDefaultSettings(): AdminSettings {
  return {
    autoConfirmBookings: true,
    photoNotificationType: 'instant',
    dashboardDateRange: 'today',
    // Phase 1: Business Hours & Contact Info
    businessHours: getDefaultBusinessHours(),
    contactPhone: '(315) 657-1332',
    contactEmail: 'jgibbs@zainesstayandplay.com',
    address: '123 Pet Paradise Lane',
    city: 'Syracuse',
    state: 'NY',
    zip: '13202',
    // Phase 3: Availability & Scheduling Rules
    availabilityRules: getDefaultAvailabilityRules(),
    // Phase 4: Blackout Dates & Seasonal Pricing
    blackoutDates: [],
    seasonalPricingRules: [],
    // Phase 5: Pricing & Fees Configuration
    pricingSettings: getDefaultPricingSettings(),
    // Phase 6: Cancellation Policy Configuration
    cancellationPolicySettings: getDefaultCancellationPolicySettings(),
    // Phase 7: Business Profile & Social Links
    businessProfileSettings: getDefaultBusinessProfileSettings(),
    // Phase 8: Website Profile & Service Area
    websiteProfileSettings: getDefaultWebsiteProfileSettings(),
  };
}
