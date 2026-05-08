import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/prisma';
import { getAdminSettings, getDefaultSettings } from '@/lib/api/admin-settings';
import type { AdminSettings, ApiResponse } from '@/types/admin';

/**
 * GET /api/settings - Get public settings (no authentication required)
 * Used by public components like footer, contact page, booking CTA
 */
export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        data: getDefaultSettings(),
      } as ApiResponse<AdminSettings>);
    }

    const settings = await getAdminSettings();

    return NextResponse.json({
      success: true,
      data: settings,
    } as ApiResponse<AdminSettings>);
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json(
      {
        success: true,
        data: getDefaultSettings(),
      } as ApiResponse<AdminSettings>,
    );
  }
}
