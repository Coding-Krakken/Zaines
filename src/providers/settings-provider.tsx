/**
 * Settings Context Provider
 * Manages dynamic site settings with real-time updates across the entire application
 * Uses React Query for efficient caching and automatic invalidation
 */

'use client';

import React, { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminSettings } from '@/types/admin';

interface SettingsContextType {
  settings: AdminSettings | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_QUERY_KEY = ['settings'];

/**
 * Default settings fallback
 */
function getDefaultSettings(): AdminSettings {
  return {
    autoConfirmBookings: true,
    photoNotificationType: 'instant',
    dashboardDateRange: 'today',
    businessHours: {
      monday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
      tuesday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
      wednesday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
      thursday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
      friday: { openTime: '06:00', closeTime: '20:00', isClosed: false },
      saturday: { openTime: '08:00', closeTime: '18:00', isClosed: false },
      sunday: { openTime: '08:00', closeTime: '18:00', isClosed: false },
    },
    contactPhone: '(315) 657-1332',
    contactEmail: 'jgibbs@zainesstayandplay.com',
    address: '123 Pet Paradise Lane',
    city: 'Syracuse',
    state: 'NY',
    zip: '13202',
    availabilityRules: {
      minNightsPerBooking: 1,
      maxNightsPerBooking: 365,
      advanceBookingWindowDays: 365,
      minimumLeadTimeDays: 0,
    },
    blackoutDates: [],
    seasonalPricingRules: [],
    pricingSettings: {
      currency: 'USD',
      standardNightlyRate: 65,
      deluxeNightlyRate: 85,
      luxuryNightlyRate: 120,
      taxRatePercent: 10,
      twoPetDiscountPercent: 15,
      threePlusPetsDiscountPercent: 20,
    },
    cancellationPolicySettings: {
      fullRefundHours: 48,
      partialRefundHours: 24,
      partialRefundPercent: 50,
      noShowRefundPercent: 0,
    },
    businessProfileSettings: {
      businessName: "Zaine's Stay & Play",
      socialLinks: {
        facebook:
          'https://www.facebook.com/people/Zaines-Stay-Play/61550036005682/',
        instagram: 'https://instagram.com/zainesstayandplay',
        twitter: 'https://twitter.com/zainesstayandplay',
      },
    },
  };
}

/**
 * Fetch settings from the API
 */
async function fetchSettings(): Promise<AdminSettings> {
  try {
    const response = await fetch('/api/settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't use Next.js cache
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.status}`);
    }

    const data = (await response.json()) as {
      success?: boolean;
      data?: AdminSettings;
    };

    return data.data || getDefaultSettings();
  } catch (error) {
    console.error('Error fetching settings:', error);
    return getDefaultSettings();
  }
}

interface SettingsProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component - wrap your app with this
 */
export function SettingsProvider({ children }: SettingsProviderProps) {
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchSettings,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: 3,
  });

  const value: SettingsContextType = {
    settings: settings || getDefaultSettings(),
    isLoading,
    error: error instanceof Error ? error : null,
    refetch: async () => {
      await refetch();
    },
  };

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

/**
 * Hook to use settings throughout the app
 * Automatically subscribes to cache updates
 */
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }

  return context;
}

/**
 * Hook to invalidate settings cache (call after updating settings)
 */
export function useInvalidateSettings() {
  const queryClient = useQueryClient();

  return {
    invalidate: async () => {
      await queryClient.invalidateQueries({
        queryKey: SETTINGS_QUERY_KEY,
      });
    },
    reset: () => {
      queryClient.resetQueries({
        queryKey: SETTINGS_QUERY_KEY,
      });
    },
  };
}
