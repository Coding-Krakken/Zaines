import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getHealthRecordsForUser } from '@/lib/health-records';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const records = await getHealthRecordsForUser(session.user.id);

  return NextResponse.json(records);
}