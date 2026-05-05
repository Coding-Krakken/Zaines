import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';

interface TimelineItem {
  id: string;
  type: 'vaccine' | 'medication' | 'weight' | 'activity';
  date: Date;
  petId: string;
  petName: string;
  title: string;
  details?: string;
  alert?: 'critical' | 'warning' | 'info';
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const petId = searchParams.get('petId');

  // Fetch all health-related data for the user's pets
  const whereClause = petId
    ? { pet: { id: petId, userId: session.user.id } }
    : { pet: { userId: session.user.id } };

  const [vaccines, medications, weightLogs, activities] = await Promise.all([
    prisma.vaccine.findMany({
      where: whereClause,
      include: { pet: { select: { id: true, name: true } } },
      orderBy: { expiryDate: 'asc' },
    }),
    prisma.medication.findMany({
      where: whereClause,
      include: { pet: { select: { id: true, name: true } } },
      orderBy: { startDate: 'desc' },
    }),
    prisma.weightLog.findMany({
      where: whereClause,
      include: { pet: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
      take: 50,
    }),
    prisma.activity.findMany({
      where: whereClause,
      include: { pet: { select: { id: true, name: true } } },
      orderBy: { performedAt: 'desc' },
      take: 50,
    }),
  ]);

  // Build timeline items with expiry alerts
  const timeline: TimelineItem[] = [];
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Add vaccines with expiry alerts
  vaccines.forEach((vaccine: {
    id: string;
    name: string;
    expiryDate: Date;
    veterinarian: string | null;
    pet: { id: string; name: string };
  }) => {
    const expiryDate = new Date(vaccine.expiryDate);
    let alert: 'critical' | 'warning' | 'info' | undefined;

    if (expiryDate < now) {
      alert = 'critical'; // Expired
    } else if (expiryDate <= thirtyDaysFromNow) {
      alert = 'critical'; // Expiring within 30 days
    } else if (expiryDate <= sixtyDaysFromNow) {
      alert = 'warning'; // Expiring within 60 days
    } else if (expiryDate <= ninetyDaysFromNow) {
      alert = 'info'; // Expiring within 90 days
    }

    timeline.push({
      id: vaccine.id,
      type: 'vaccine',
      date: expiryDate,
      petId: vaccine.pet.id,
      petName: vaccine.pet.name,
      title: `${vaccine.name} - ${alert === 'critical' && expiryDate < now ? 'Expired' : 'Expires'}`,
      details: vaccine.veterinarian || undefined,
      alert,
    });
  });

  // Add medications
  medications.forEach((medication: {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    startDate: Date;
    endDate: Date | null;
    pet: { id: string; name: string };
  }) => {
    const isActive = !medication.endDate || new Date(medication.endDate) > now;
    timeline.push({
      id: medication.id,
      type: 'medication',
      date: new Date(medication.startDate),
      petId: medication.pet.id,
      petName: medication.pet.name,
      title: `${medication.name} - ${medication.dosage}`,
      details: `${medication.frequency}${isActive ? ' (Active)' : ' (Completed)'}`,
      alert: undefined,
    });
  });

  // Add weight logs
  weightLogs.forEach((log: {
    id: string;
    weight: number;
    date: Date;
    notes: string | null;
    pet: { id: string; name: string };
  }) => {
    timeline.push({
      id: log.id,
      type: 'weight',
      date: new Date(log.date),
      petId: log.pet.id,
      petName: log.pet.name,
      title: `Weight: ${log.weight} lbs`,
      details: log.notes || undefined,
      alert: undefined,
    });
  });

  // Add activities
  activities.forEach((activity: {
    id: string;
    type: string;
    performedAt: Date;
    notes: string | null;
    pet: { id: string; name: string };
  }) => {
    timeline.push({
      id: activity.id,
      type: 'activity',
      date: new Date(activity.performedAt),
      petId: activity.pet.id,
      petName: activity.pet.name,
      title: activity.type,
      details: activity.notes || undefined,
      alert: undefined,
    });
  });

  // Sort by date descending
  timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Get alerts summary
  const alerts = {
    critical: timeline.filter((item) => item.alert === 'critical').length,
    warning: timeline.filter((item) => item.alert === 'warning').length,
    info: timeline.filter((item) => item.alert === 'info').length,
  };

  return NextResponse.json({
    timeline,
    alerts,
    total: timeline.length,
  });
}
