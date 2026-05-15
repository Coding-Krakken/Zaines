'use client';

import Link from "next/link";
import Image from "next/image";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const { contactInfo, businessHours, businessName, socialLinks, websiteProfile } = useSiteSettings();

  return (
    <footer id="site-footer" style={{ backgroundColor: "var(--color-navy)" }} className="text-background/85">
      <div className="container py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="focus-ring group mb-5 flex w-fit items-center gap-2.5 rounded-md"
              aria-label="Paws & Play Doggy Daycare — Home"
            >
              {websiteProfile.logoImageUrl ? (
                <Image
                  src={websiteProfile.logoImageUrl}
                  alt="Paws & Play logo"
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center text-2xl">
                  🐾
                </span>
              )}
              <div className="flex flex-col">
                <span className="font-display text-xl font-bold text-white tracking-tight leading-none">
                  Paws &amp; Play
                </span>
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-background/50">
                  Doggy Daycare
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs text-background/70">
              Syracuse&apos;s happiest doggy daycare. Safe, supervised, tail-wagging playtime, enrichment, and care for your best friend.
            </p>
            <div className="flex gap-4 mb-6">
              <Link
                href={socialLinks.facebook}
                aria-label="Paws & Play on Facebook"
                className="focus-ring rounded-sm text-background/50 hover:text-white transition-colors"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Facebook className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href={socialLinks.instagram}
                aria-label="Paws & Play on Instagram"
                className="focus-ring rounded-sm text-background/50 hover:text-white transition-colors"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href={socialLinks.twitter}
                aria-label="Paws & Play on X (Twitter)"
                className="focus-ring rounded-sm text-background/50 hover:text-white transition-colors"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Twitter className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-5">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                ["Home", "/"],
                ["About Us", "/about"],
                ["Reviews", "/reviews"],
                ["Gallery", "/gallery"],
                ["FAQ", "/faq"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="focus-ring rounded-sm text-background/70 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-5">
              Services
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                ["Doggy Daycare", "/services/daycare"],
                ["Puppy Play", "/services/daycare"],
                ["Boarding", "/services/boarding"],
                ["Grooming", "/services/grooming"],
                ["Enrichment", "/services/daycare"],
                ["Birthday Pawties", "/services/daycare"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="focus-ring rounded-sm text-background/70 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-5">
              Contact Us
            </h3>
            <ul className="space-y-3 text-sm mb-6">
              <li className="flex items-center gap-2">
                <MapPin
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: "var(--color-yellow)" }}
                  aria-hidden="true"
                />
                <span className="text-background/70">
                  Syracuse, NY 13209
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: "var(--color-yellow)" }}
                  aria-hidden="true"
                />
                <a
                  href="tel:3155555PAWS"
                  className="focus-ring rounded-sm text-background/70 hover:text-white transition-colors"
                >
                  (315) 555-PAWS
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: "var(--color-yellow)" }}
                  aria-hidden="true"
                />
                <a
                  href="mailto:hello@pawsandplay.com"
                  className="focus-ring break-all rounded-sm text-background/70 hover:text-white transition-colors"
                >
                  hello@pawsandplay.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock
                  className="h-4 w-4 mt-0.5 flex-shrink-0"
                  style={{ color: "var(--color-yellow)" }}
                  aria-hidden="true"
                />
                <span className="text-background/70">
                  Mon-Fri: 6:30am - 7:00pm
                  <br />
                  Sat-Sun: 8:00am - 6:00pm
                </span>
              </li>
            </ul>

            {/* Newsletter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">
                Stay Connected!
              </h4>
              <p className="text-xs text-background/60 mb-3">
                Get special offers, fun updates, and photo highlights!
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="h-9 text-sm bg-white/10 border-white/20 text-white placeholder:text-background/40 focus:border-white/40"
                  aria-label="Email address for newsletter"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 px-4 text-xs font-bold"
                  style={{
                    background: "var(--color-yellow)",
                    color: "var(--color-navy)",
                  }}
                >
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-14 border-t border-background/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-background/40">
          <p>
            &copy; {currentYear} Paws &amp; Play Doggy Daycare. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="focus-ring rounded-sm hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="focus-ring rounded-sm hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

