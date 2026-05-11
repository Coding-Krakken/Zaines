"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { UserNav } from "@/components/user-nav";
import { cn } from "@/lib/utils";
import { navItems } from "@/config/site";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-background/96 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-background/80 backdrop-blur-sm border-b border-transparent"
      )}
    >
      <div className="container flex h-18 min-h-[4.5rem] items-center justify-between gap-4">
        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group flex-shrink-0"
          aria-label="Zaine's Stay & Play — Home"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-base transition-colors group-hover:bg-primary/20"
            aria-hidden="true"
          >
            🐾
          </span>
          <span className="font-display text-lg font-semibold text-foreground hidden sm:block tracking-tight">
            Zaine&apos;s Stay &amp; Play
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navItems
            .filter((item) => item.title !== "Book Now")
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={item.href === "/suites" ? false : undefined}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {item.title}
              </Link>
            ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="hidden md:inline-flex shadow-sm shadow-primary/15 hover:shadow-primary/25 transition-shadow"
          >
            <Link href="/book">Reserve a Suite</Link>
          </Button>
          <UserNav />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

