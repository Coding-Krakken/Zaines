import Link from 'next/link';

export function AdminNav() {
  return (
    <nav className="border-b bg-card px-6 py-3 flex flex-wrap items-center gap-4">
      <span className="font-semibold text-sm">🐾 Staff Dashboard</span>
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
        Overview
      </Link>
      <Link href="/admin/occupancy" className="text-sm text-muted-foreground hover:text-foreground">
        Occupancy
      </Link>
      <Link href="/admin/activities" className="text-sm text-muted-foreground hover:text-foreground">
        Activities
      </Link>
      <Link href="/admin/photos" className="text-sm text-muted-foreground hover:text-foreground">
        Photos
      </Link>
      <Link href="/admin/contacts" className="text-sm text-muted-foreground hover:text-foreground">
        Contacts
      </Link>
    </nav>
  );
}
