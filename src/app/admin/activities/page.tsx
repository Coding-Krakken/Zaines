import { ActivityLogPanel } from '@/components/admin/ActivityLogPanel';

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
      <ActivityLogPanel initialBookingId={resolvedSearchParams?.bookingId} />
    </div>
  );
}
