import { getRecentContactSubmissions } from "@/lib/api/issue26";
import { ContactSubmissionCard } from "@/components/admin/ContactSubmissionCard";
import { MessageReassociationPanel } from "@/components/admin/MessageReassociationPanel";
import { AdminEmptyState, AdminErrorState } from "@/components/admin/AdminAsyncState";
import { AdminRunbookActions } from "@/components/admin/AdminRunbookActions";

export default async function AdminMessagesPage() {
  let submissions: Awaited<ReturnType<typeof getRecentContactSubmissions>> = [];

  try {
    submissions = await getRecentContactSubmissions(200);
  } catch (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Contact Messages</h1>
          <p className="text-sm text-muted-foreground">
            Messages submitted from the public contact form.
          </p>
        </div>

        <AdminErrorState
          title="Unable to load contact messages"
          message={
            error instanceof Error
              ? error.message
              : "Contact message data is temporarily unavailable."
          }
          action={{
            label: "Open Contacts Runbook",
            href: "/admin/contacts",
          }}
        />
      </div>
    );
  }

  const openCount = submissions.filter((s) => s.status === "open").length;
  const resolvedCount = submissions.filter((s) => s.status === "resolved").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Contact Messages</h1>
        <p className="text-sm text-muted-foreground">
          Messages submitted from the public contact form.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Open: <span className="font-medium">{openCount}</span> • Resolved: <span className="font-medium">{resolvedCount}</span>
        </p>
      </div>

      <AdminRunbookActions
        title="Message Triage Runbook"
        description="Use these paths to unblock communication workflows and validate context for each thread."
        actions={[
          {
            label: "Open Contacts",
            href: "/admin/contacts",
            helperText: "Validate emergency and alternate contact details.",
          },
          {
            label: "Checked-In Bookings",
            href: "/admin/bookings?status=checked_in",
            helperText: "Attach messages to active in-house stays.",
          },
          {
            label: "Pending Confirmations",
            href: "/admin/bookings?status=pending",
            helperText: "Resolve pre-arrival questions and confirmations.",
          },
          {
            label: "Finance Console",
            href: "/admin/finance",
            helperText: "Handle payment-related inquiry escalations.",
          },
        ]}
      />

      <MessageReassociationPanel />

      {submissions.length === 0 ? (
        <AdminEmptyState
          title="No contact submissions yet"
          message="When customers submit the contact form, messages and triage actions will appear here."
          action={{
            label: "Review Contact Path",
            href: "/admin/contacts",
          }}
        />
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <ContactSubmissionCard key={submission.submissionId} {...submission} />
          ))}
        </div>
      )}
    </div>
  );
}
