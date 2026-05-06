import { OccupancyGrid } from "@/components/admin/OccupancyGrid";

export default async function AdminOccupancyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Suite Occupancy</h1>
        <p className="text-sm text-muted-foreground">
          Monitor active occupancy and jump to check-out actions.
        </p>
      </div>
      <OccupancyGrid />
    </div>
  );
}
