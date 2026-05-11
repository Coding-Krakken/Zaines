import { ActivityLogPanel } from '@/components/admin/ActivityLogPanel';
import { AdminRunbookActions } from '@/components/admin/AdminRunbookActions';

export default async function AdminActivitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ bookingId?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Activity Logging</h1>
        <p className="text-sm text-muted-foreground">
          Capture care events quickly while pets are checked in.
        </p>
      </div>

      <AdminRunbookActions
        title="Activity Runbook"
        description="When activity streams are empty, verify these upstream dependencies first."
        actions={[
          {
            label: 'Checked-In Bookings',
            href: '/admin/bookings?status=checked_in',
            helperText: 'Ensure active bookings exist for activity logging.',
          },
          {
            label: 'Suite Occupancy',
            href: '/admin/occupancy',
            helperText: 'Cross-check room occupancy against booking status.',
          },
          {
            label: 'Photo Uploads',
            href: '/admin/photos',
            helperText: 'Validate related owner update workflow continuity.',
          },
          {
            label: 'Customer Messages',
            href: '/admin/messages',
            helperText: 'Respond if owners ask for missing activity updates.',
          },
        ]}
      />

      <ActivityLogPanel initialBookingId={resolvedSearchParams?.bookingId} />
    </div>
  );
}
