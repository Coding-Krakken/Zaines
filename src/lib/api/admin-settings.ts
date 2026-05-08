/**
 * Admin Settings API - Server-side helpers for admin settings management
 * Handles reading/writing settings stored in the Settings table
 */

import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import type { AdminSettings, BusinessHours, AvailabilityRules } from '@/types/admin';

const SETTINGS_KEYS = {
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
  };
}
