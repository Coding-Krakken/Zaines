import { PhotoUploadPanel } from '@/components/admin/PhotoUploadPanel';
import { AdminRunbookActions } from '@/components/admin/AdminRunbookActions';

export default async function AdminPhotosPage({
  searchParams,
}: {
  searchParams?: { bookingId?: string };
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Media Uploads</h1>
        <p className="text-sm text-muted-foreground">
          Upload pet photos for active stays with minimal steps.
        </p>
      </div>

      <AdminRunbookActions
        title="Photo Update Runbook"
        description="Use these links when uploads are blocked or owner notifications need follow-up."
        actions={[
          {
            label: 'Checked-In Bookings',
            href: '/admin/bookings?status=checked_in',
            helperText: 'Confirm an active stay exists before uploading photos.',
          },
          {
            label: 'Activity Logging',
            href: '/admin/activities',
            helperText: 'Pair media posts with care timeline updates.',
          },
          {
            label: 'Customer Messages',
            href: '/admin/messages',
            helperText: 'Respond to owner update requests quickly.',
          },
          {
            label: 'Occupancy View',
            href: '/admin/occupancy',
            helperText: 'Verify suite-level status for the selected booking.',
          },
        ]}
      />

      <PhotoUploadPanel initialBookingId={searchParams?.bookingId} />
    </div>
  );
}
