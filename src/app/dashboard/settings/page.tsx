import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { ProfileForm } from './ProfileForm';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  const user = isDatabaseConfigured()
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, phone: true },
      })
    : null;

  return (
    <div className="container mx-auto p-6 max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      <ProfileForm
        defaultName={user?.name ?? session.user.name ?? ''}
        defaultPhone={user?.phone ?? ''}
        email={user?.email ?? session.user.email ?? ''}
      />
    </div>
  );
}
