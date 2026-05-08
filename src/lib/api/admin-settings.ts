/**
 * Admin Settings API - Server-side helpers for admin settings management
 * Handles reading/writing settings stored in the Settings table
 */

import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import type { AdminSettings } from '@/types/admin';

const SETTINGS_KEYS = {
  AUTO_CONFIRM_BOOKINGS: 'admin.auto_confirm_bookings',
  PHOTO_NOTIFICATION_TYPE: 'admin.photo_notification_type',
  PHOTO_NOTIFICATION_TIME: 'admin.photo_notification_time',
  DASHBOARD_DATE_RANGE: 'admin.dashboard_date_range',
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

    return {
      autoConfirmBookings:
        settingsMap.get(SETTINGS_KEYS.AUTO_CONFIRM_BOOKINGS) === 'true',
      photoNotificationType: (settingsMap.get(SETTINGS_KEYS.PHOTO_NOTIFICATION_TYPE) ||
        'instant') as 'instant' | 'daily_batch',
      photoNotificationTime: settingsMap.get(SETTINGS_KEYS.PHOTO_NOTIFICATION_TIME),
      dashboardDateRange: (settingsMap.get(SETTINGS_KEYS.DASHBOARD_DATE_RANGE) ||
        'today') as 'today' | 'today_tomorrow' | 'this_week',
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

    await Promise.all(updatePromises);

    // Return updated settings
    return getAdminSettings();
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return getAdminSettings();
  }
}

/**
 * Get default admin settings
 */
export function getDefaultSettings(): AdminSettings {
  return {
    autoConfirmBookings: true,
    photoNotificationType: 'instant',
    dashboardDateRange: 'today',
  };
}
