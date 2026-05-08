import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isDatabaseConfigured } from '@/lib/prisma';
import { prisma } from '@/lib/prisma';
import { getAdminSettings } from '@/lib/api/admin-settings';

/**
 * POST /api/admin/photo-notifications - Queue or send photo notifications
 * Handles notification preferences (instant vs daily batch)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const role = (session.user as { id: string; role?: string }).role;
    if (!role || !['staff', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 },
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { photoId, bookingId, petName, ownerEmail, notifyOwner } = await request.json();

    if (!photoId || !bookingId || !ownerEmail || notifyOwner === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // If owner notification is disabled, do nothing
    if (!notifyOwner) {
      return NextResponse.json({
        success: true,
        queued: false,
        reason: 'Owner notification disabled',
      });
    }

    // Get admin settings to check notification preference
    const settings = await getAdminSettings();

    // Create notification record
    const notification = await prisma.photoNotification.create({
      data: {
        photoId,
        bookingId,
        ownerEmail,
        petName: petName || 'Your pet',
        type: settings.photoNotificationType,
        scheduledFor:
          settings.photoNotificationType === 'daily_batch'
            ? calculateNextBatchTime(settings.photoNotificationTime ?? null)
            : new Date(),
        sent: false,
      },
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        type: notification.type,
        scheduledFor: notification.scheduledFor,
        queued: true,
      },
    });
  } catch (error) {
    console.error('Error queueing photo notification:', error);
    return NextResponse.json(
      { error: 'Failed to queue notification' },
      { status: 500 },
    );
  }
}

/**
 * Calculate next batch send time based on configured time
 * e.g., if time is "17:00", calculate next 5 PM
 */
function calculateNextBatchTime(timeString: string | null): Date {
  const now = new Date();
  const batchTime = timeString || '17:00'; // Default to 5 PM if not set
  const [hours, minutes] = batchTime.split(':').map(Number);

  const nextBatch = new Date();
  nextBatch.setHours(hours, minutes, 0, 0);

  // If batch time has already passed today, schedule for tomorrow
  if (nextBatch <= now) {
    nextBatch.setDate(nextBatch.getDate() + 1);
  }

  return nextBatch;
}
