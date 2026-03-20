import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card px-6 py-3 flex items-center gap-6">
        <span className="font-semibold text-sm">🐾 Staff Dashboard</span>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Overview
        </Link>
      </nav>
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
