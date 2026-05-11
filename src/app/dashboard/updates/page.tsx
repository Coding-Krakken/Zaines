import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/prisma";
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
        <h1 className="text-3xl font-bold">Updates</h1>
        <p className="text-muted-foreground">
          Database is not configured. Updates are unavailable in this environment.
        </p>
      </div>
    );
  }

  return <UpdatesHubClient />;
}
