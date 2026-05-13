import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAdminSettings } from "@/lib/api/admin-settings";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardUnavailableState } from "@/components/dashboard/dashboard-states";
import { ProfileForm } from "./ProfileForm";

export const metadata = {
  title: "Settings | Dashboard",
  description: "Manage your account settings and preferences",
};

/**
 * Dashboard Settings Page
 * 
 * FIXED (Issue #100): Proper authentication guard.
 * Auth check: redirect only if user is NOT authenticated.
 * The session is used to fetch user data and protect the route.
 */
export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/signin");

  if (!isDatabaseConfigured()) {
    return (
      <DashboardUnavailableState
        title="Settings unavailable"
        description="Database is not configured. Settings are unavailable in this environment."
      />
    );
  }

  // Fetch user profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  });

  if (!user) {
    return redirect("/auth/signin");
  }

  let billingPortalEnabled = false;
  try {
    const settings = await getAdminSettings();
    billingPortalEnabled = settings.stripeCapabilityFlags.customerPortalEnabled;
  } catch {
    billingPortalEnabled = false;
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Account"
        title="Settings"
        description="Update profile details and billing preferences for your customer portal access."
      />
      <ProfileForm user={user} billingPortalEnabled={billingPortalEnabled} />
    </div>
  );
}
