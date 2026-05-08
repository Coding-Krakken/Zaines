import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/prisma';
import { getServicesWithTypes, updateServices } from '@/lib/api/admin-services';
import type { ApiResponse } from '@/types/admin';

interface ServiceUpdate {
  id: string;
  price?: number;
  isActive?: boolean;
}

/**
 * GET /api/admin/services - Get all services grouped by type
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { id: string; role?: string }).role;
    if (!role || !['staff', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 },
      );
    }

    const result = await getServicesWithTypes();

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    } as ApiResponse<typeof result>);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/services - Update multiple services (pricing, active status)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { id: string; role?: string }).role;
    if (!role || !['staff', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { services: ServiceUpdate[] };

    if (!body.services || !Array.isArray(body.services)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 },
      );
    }

    const updated = await updateServices(body.services);

    return NextResponse.json({
      success: true,
      data: { services: updated },
    } as ApiResponse<{ services: typeof updated }>);
  } catch (error) {
    console.error('Error updating services:', error);
    return NextResponse.json(
      { error: 'Failed to update services' },
      { status: 500 },
    );
  }
}
