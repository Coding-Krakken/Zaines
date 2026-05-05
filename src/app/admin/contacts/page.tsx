import { EmergencyContactsTable } from '@/components/admin/EmergencyContactsTable';

export default async function AdminContactsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Emergency Contacts</h1>
        <p className="text-sm text-muted-foreground">
          Retrieve owner contacts quickly during active stays.
        </p>
      </div>
      <EmergencyContactsTable />
    </div>
  );
}
