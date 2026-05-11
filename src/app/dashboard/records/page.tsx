import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Records Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload and manage pet-specific medical records, plus sign account waivers.
        </p>
      </div>

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
  );
}
