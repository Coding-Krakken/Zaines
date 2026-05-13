import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header';
import { getHealthRecordsForUser } from '@/lib/health-records';
import { RecordsClient } from './RecordsClient';

export const metadata = {
  title: 'Records | Dashboard',
  description: 'Manage vaccination records and account waivers',
};

export default async function DashboardRecordsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return redirect('/auth/signin');
  }

  const records = await getHealthRecordsForUser(session.user.id);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Health & Legal"
        title="Records Center"
        description="Upload and manage pet-specific medical records, plus sign account waivers."
        className="luxury-shell"
      />

      <div className="rounded-2xl border border-border/70 bg-card/70 p-4 md:p-5">
        <RecordsClient
          accountWaivers={records.accountWaivers.map((waiver) => ({
            id: waiver.id,
            type: waiver.type as 'liability' | 'medical' | 'photo_release',
            signedAt: waiver.signedAt.toISOString(),
            expiresAt: waiver.expiresAt ? waiver.expiresAt.toISOString() : null,
          }))}
          pets={records.pets.map((pet) => ({
            id: pet.id,
            name: pet.name,
            vaccines: pet.vaccines.map((vaccine) => ({
              id: vaccine.id,
              name: vaccine.name,
              expiryDate: vaccine.expiryDate.toISOString(),
              documentUrl: vaccine.documentUrl,
            })),
          }))}
        />
      </div>
    </div>
  );
}
