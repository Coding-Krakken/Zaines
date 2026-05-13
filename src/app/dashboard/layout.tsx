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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <CustomerDashboardNav />
          </div>

          <main className="min-w-0 space-y-6 rounded-2xl border border-border/40 bg-card/30 p-3 md:p-4">
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
