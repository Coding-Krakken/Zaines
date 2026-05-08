import { auth } from '@/lib/auth';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getAdminSettings } from '@/lib/api/admin-settings';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const role = (session.user as { id: string; role?: string }).role;
  if (!role || !['staff', 'admin'].includes(role)) {
    redirect('/dashboard');
  }

  if (!isDatabaseConfigured()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Staff Dashboard</h1>
        <p className="text-muted-foreground">
          Database is not configured. Dashboard data is unavailable.
        </p>
      </div>
    );
  }

  // Load admin settings for date range
  const settings = await getAdminSettings();

  return <AdminDashboardClient dateRange={settings.dashboardDateRange} />;
}
