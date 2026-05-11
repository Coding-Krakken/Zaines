import { ReassociationAuditPanel } from "@/components/admin/ReassociationAuditPanel";

export default function AdminAssociationAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Association Audit</h1>
        <p className="text-sm text-muted-foreground">
          Review historical reassociation actions for account-level and booking-linked updates.
        </p>
      </div>

      <ReassociationAuditPanel />
    </div>
  );
}
