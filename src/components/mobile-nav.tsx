"use client";

import * as React from "react";
/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { navItems } from "@/config/site";
import { UserNav } from "@/components/user-nav";
import { AdminCameraCapture } from "@/components/admin/AdminCameraCapture";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const showAdminCamera = status === "authenticated" && role === "admin";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="focus-ring md:hidden"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-site-nav"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-[300px] sm:w-[400px]" 
        id="mobile-site-nav"
        aria-describedby="mobile-nav-description"
      >
        <SheetHeader>
          <SheetTitle>
            <Link
              href="/"
              className="focus-ring flex items-center space-x-2 rounded-md"
              onClick={() => setOpen(false)}
            >
              <span className="text-2xl">🐾</span>
              <span className="font-bold">Zaine's Stay & Play</span>
            </Link>
          </SheetTitle>
          <p id="mobile-nav-description" className="sr-only">
            Main navigation menu with links to services, booking, and account options
          </p>
        </SheetHeader>
        <nav className="mt-8 flex flex-col gap-4" aria-label="Mobile site navigation">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <UserNav />
            </div>
            {showAdminCamera ? (
              <div className="flex-shrink-0">
                <AdminCameraCapture />
              </div>
            ) : null}
          </div>
          <Button asChild className="w-full">
            <Link href="/book" onClick={() => setOpen(false)}>
              Book Now
            </Link>
          </Button>
          <Accordion type="single" collapsible className="w-full">
            {navItems.map((item, index) =>
              item.children ? (
                <AccordionItem key={item.href} value={`item-${index}`}>
                  <AccordionTrigger className="focus-ring rounded-md text-sm font-medium">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-2 pl-4">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className="focus-ring rounded-md py-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <div key={item.href} className="border-b py-3">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="focus-ring rounded-md text-sm font-medium hover:text-primary"
                  >
                    {item.title}
                  </Link>
                </div>
              ),
            )}
          </Accordion>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
