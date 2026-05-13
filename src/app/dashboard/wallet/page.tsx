import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminSettings } from "@/lib/api/admin-settings";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardUnavailableState } from "@/components/dashboard/dashboard-states";
import { WalletManager } from "./wallet-manager";

export const metadata = {
  title: "Payment Wallet | Dashboard",
  description: "Manage saved payment methods and default card preferences",
};

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/auth/signin");

  const settings = await getAdminSettings();
  if (!settings.stripeCapabilityFlags.savedPaymentMethodsEnabled) {
    return (
      <DashboardUnavailableState
        title="Wallet unavailable"
        description="Saved payment methods are not enabled in this environment."
      />
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Billing"
        title="Payment Wallet"
        description="Add, remove, and set your default payment methods for one-click rebooking."
        className="luxury-shell"
      />
      <div className="rounded-2xl border border-border/70 bg-card/70 p-4 md:p-5">
        <WalletManager />
      </div>
    </div>
  );
}
