import { EmergencyContactsTable } from '@/components/admin/EmergencyContactsTable';
import { AdminRunbookActions } from '@/components/admin/AdminRunbookActions';

export default async function AdminContactsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Emergency Contacts</h1>
        <p className="text-sm text-muted-foreground">
          Retrieve owner contacts quickly during active stays.
        </p>
      </div>

      <AdminRunbookActions
        title="Contact Response Runbook"
        description="Use these shortcuts during escalations to quickly locate active booking context."
        actions={[
          {
            label: 'Checked-In Bookings',
            href: '/admin/bookings?status=checked_in',
            helperText: 'Find the active reservation tied to a contact event.',
          },
          {
            label: 'Occupancy Dashboard',
            href: '/admin/occupancy',
            helperText: 'Identify suite and pet context for urgent calls.',
          },
          {
            label: 'Customer Messages',
            href: '/admin/messages',
            helperText: 'Cross-reference outreach history and inbound requests.',
          },
          {
            label: 'Activity Timeline',
            href: '/admin/activities',
            helperText: 'Check recent care entries before contacting owners.',
          },
        ]}
      />

      <EmergencyContactsTable />
    </div>
  );
}
