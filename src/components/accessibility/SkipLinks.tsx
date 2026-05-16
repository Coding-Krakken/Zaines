/**
 * Skip Links Component
 * 
 * Phase 8: Accessibility - Bypass blocks for keyboard navigation
 * 
 * WCAG 2.4.1 Level A: Bypass Blocks
 * Provides keyboard users a way to skip navigation and jump to main content
 */

"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function SkipLinks() {
  return (
    <div className="sr-only-focusable">
      <Link
        href="#main-content"
        className={cn(
          "skip-link",
          "fixed left-4 top-4 z-[9999]",
          "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
          "focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "transition-transform"
        )}
      >
        Skip to main content
      </Link>
      <Link
        href="#navigation"
        className={cn(
          "skip-link",
          "fixed left-4 top-16 z-[9999]",
          "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
          "focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "transition-transform"
        )}
      >
        Skip to navigation
      </Link>
    </div>
  );
}
