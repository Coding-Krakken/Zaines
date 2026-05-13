import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/prisma";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { UpdatesHubClient } from "@/components/dashboard/UpdatesHubClient";

export const metadata = {
  title: "Updates | Dashboard",
  description: "Centralized timeline for customer photos and messaging",
};

export default async function UpdatesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/auth/signin");
  }

  if (!isDatabaseConfigured()) {
    return (
      <div className="space-y-3">
        <DashboardPageHeader
          eyebrow="Customer Updates"
          title="Updates"
          description="Database is not configured. Updates are unavailable in this environment."
        />
      </div>
    );
  }

  return <UpdatesHubClient />;
}
