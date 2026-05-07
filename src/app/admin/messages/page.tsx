import { getRecentContactSubmissions } from "@/lib/api/issue26";
import { Card, CardContent } from "@/components/ui/card";
import { ContactSubmissionCard } from "@/components/admin/ContactSubmissionCard";

export default async function AdminMessagesPage() {
  const submissions = await getRecentContactSubmissions(200);
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

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No contact submissions yet.
          </CardContent>
        </Card>
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
