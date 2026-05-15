import { auth } from "@/lib/auth";
import { CustomerDashboardMobileNav, CustomerDashboardNav } from "@/components/dashboard/customer-dashboard-nav";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authentication for all dashboard routes
  const session = await auth();
  if (!session?.user?.id) {
    return redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.93_0.04_212)] via-[oklch(0.99_0.008_90)] to-white">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <CustomerDashboardNav />
          </div>

          <main className="min-w-0 space-y-6 rounded-2xl border border-[oklch(0.93_0.04_212)] bg-white/70 p-3 md:p-4 shadow-[0_8px_32px_-16px_oklch(0.78_0.13_208/0.2)]">
            <div className="lg:hidden">
              <CustomerDashboardMobileNav />
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
