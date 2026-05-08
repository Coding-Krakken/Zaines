import Link from 'next/link';

export function AdminNav() {
  return (
    <nav className="border-b bg-card px-6 py-3 flex flex-wrap items-center gap-4">
      <span className="font-semibold text-sm">🐾 Staff Dashboard</span>
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
        Admin Home
      </Link>
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        Customer View
      </Link>
    </nav>
  );
}
