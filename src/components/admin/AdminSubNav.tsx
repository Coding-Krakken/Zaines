"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
    href: "/admin/bookings",
    label: "Bookings",
    match: (pathname) => pathname.startsWith("/admin/bookings"),
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
  {
    href: "/admin/settings",
    label: "Settings",
    match: (pathname) => pathname.startsWith("/admin/settings"),
  },
];

export function AdminSubNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    for (const item of adminSubNavItems) {
      router.prefetch(item.href);
    }
  }, [router]);

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <nav className="border-b bg-muted/30 px-6 py-2">
      <ul className="flex flex-wrap gap-2">
        {adminSubNavItems.map((item) => {
          const active = item.match(pathname);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={(event) => handleNavigate(event, item.href)}
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
