import { OccupancyGrid } from '@/components/admin/OccupancyGrid';
import { AdminRunbookActions } from '@/components/admin/AdminRunbookActions';

export default async function AdminOccupancyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Suite Occupancy</h1>
        <p className="text-sm text-muted-foreground">
          Monitor active occupancy and jump to check-out actions.
        </p>
      </div>

      <AdminRunbookActions
        title="Occupancy Runbook"
        description="Use these shortcuts when occupancy data is empty or a suite state requires intervention."
        actions={[
          {
            label: 'Review Pending Confirmations',
            href: '/admin/bookings?status=pending',
            helperText: 'Resolve unconfirmed arrivals before check-in time.',
          },
          {
            label: 'Open Checked-In Bookings',
            href: '/admin/bookings?status=checked_in',
            helperText: 'Validate occupancy against active bookings.',
          },
          {
            label: 'Go To Activities',
            href: '/admin/activities',
            helperText: 'Check whether active stays are receiving updates.',
          },
          {
            label: 'Go To Photos',
            href: '/admin/photos',
            helperText: 'Confirm owner-facing media updates are flowing.',
          },
        ]}
      />

      <OccupancyGrid />
    </div>
  );
}
