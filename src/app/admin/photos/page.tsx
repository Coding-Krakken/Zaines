import { PhotoUploadPanel } from "@/components/admin/PhotoUploadPanel";

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
      <PhotoUploadPanel initialBookingId={searchParams?.bookingId} />
    </div>
  );
}
