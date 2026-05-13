import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/prisma";
import { DashboardUnavailableState } from "@/components/dashboard/dashboard-states";
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
      <DashboardUnavailableState
        title="Updates unavailable"
        description="Database is not configured. Updates are unavailable in this environment."
      />
    );
  }

  return <UpdatesHubClient />;
}
