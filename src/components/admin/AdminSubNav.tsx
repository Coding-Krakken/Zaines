"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminSubNavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

const adminSubNavItems: AdminSubNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    match: (pathname) => pathname === "/admin",
  },
  {
    href: "/admin/occupancy",
    label: "Occupancy",
    match: (pathname) => pathname.startsWith("/admin/occupancy"),
  },
  {
    href: "/admin/activities",
    label: "Activity Log",
    match: (pathname) => pathname.startsWith("/admin/activities"),
  },
  {
    href: "/admin/photos",
    label: "Photos",
    match: (pathname) => pathname.startsWith("/admin/photos"),
  },
  {
    href: "/admin/contacts",
    label: "Emergency Contacts",
    match: (pathname) => pathname.startsWith("/admin/contacts"),
  },
  {
    href: "/admin/messages",
    label: "Customer Messages",
    match: (pathname) => pathname.startsWith("/admin/messages"),
  },
];

export function AdminSubNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-muted/30 px-6 py-2">
      <ul className="flex flex-wrap gap-2">
        {adminSubNavItems.map((item) => {
          const active = item.match(pathname);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`inline-flex rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
