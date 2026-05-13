'use client';

import Link from "next/link";
import Image from "next/image";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, Clock } from "lucide-react";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const { contactInfo, businessHours, businessName, socialLinks, websiteProfile } = useSiteSettings();

  return (
    <footer id="site-footer" className="bg-foreground text-background/70">
      <div className="container py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="focus-ring group mb-5 flex w-fit items-center gap-2.5 rounded-md"
              aria-label="Zaine's Stay & Play — Home"
            >
              {websiteProfile.logoImageUrl ? (
                <Image
                  src={websiteProfile.logoImageUrl}
                  alt="Site logo"
                  width={32}
                  height={32}
                  unoptimized
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm">
                  🐾
                </span>
              )}
              <span className="font-display text-lg font-semibold text-background tracking-tight">
                {businessName}
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-2 max-w-xs">
              Boutique private dog boarding in Syracuse, NY. Three suites,
              owner always on-site, genuine individualized care.
            </p>
            <p className="text-xs text-background/40 mb-6 max-w-xs italic">
              &ldquo;Your dog is family. We treat them that way.&rdquo;
            </p>
            <div className="flex gap-4">
              <Link
                href={socialLinks.facebook}
                aria-label="Zaine's Stay & Play on Facebook"
                className="focus-ring rounded-sm text-background/40 hover:text-primary transition-colors"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Facebook className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={socialLinks.instagram}
                aria-label="Zaine's Stay & Play on Instagram"
                className="focus-ring rounded-sm text-background/40 hover:text-primary transition-colors"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={socialLinks.twitter}
                aria-label="Zaine's Stay & Play on X (Twitter)"
                className="focus-ring rounded-sm text-background/40 hover:text-primary transition-colors"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Twitter className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Boarding */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-background/40 mb-5">
              Boarding
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                ["Suite Options", "/suites"],
                ["Pricing", "/pricing"],
                ["Book Now", "/book"],
                ["Dog Boarding Syracuse", "/dog-boarding-syracuse"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    prefetch={href === "/suites" ? false : undefined}
                    className="focus-ring rounded-sm hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-background/40 mb-5">
              Company
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                ["About Us", "/about"],
                ["Reviews", "/reviews"],
                ["FAQ", "/faq"],
                ["Contact", "/contact"],
                ["Policies", "/policies"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="focus-ring rounded-sm hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Service Area */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-background/40 mb-5">
              Contact
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <address
                  className="not-italic flex items-start gap-2"
                  itemProp="address"
                  itemScope
                  itemType="https://schema.org/PostalAddress"
                >
                  <MapPin
                    className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary/70"
                    aria-hidden="true"
                  />
                  <span>
                    <span itemProp="streetAddress">
                      {contactInfo.address}
                    </span>
                    <br />
                    <span itemProp="addressLocality">
                      {contactInfo.city}
                    </span>
                    ,{" "}
                    <span itemProp="addressRegion">
                      {contactInfo.state}
                    </span>{" "}
                    <span itemProp="postalCode">{contactInfo.zip}</span>
                  </span>
                </address>
              </li>
              <li className="flex items-center gap-2">
                <Phone
                  className="h-3.5 w-3.5 flex-shrink-0 text-primary/70"
                  aria-hidden="true"
                />
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="focus-ring rounded-sm hover:text-primary transition-colors"
                  itemProp="telephone"
                >
                  {contactInfo.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail
                  className="h-3.5 w-3.5 flex-shrink-0 text-primary/70"
                  aria-hidden="true"
                />
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="focus-ring break-all rounded-sm hover:text-primary transition-colors"
                  itemProp="email"
                >
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock
                  className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary/70"
                  aria-hidden="true"
                />
                <span>
                  {businessHours.monday.openTime}-{businessHours.monday.closeTime} (Mon-Fri)
                  <br />
                  {businessHours.saturday.openTime}-{businessHours.saturday.closeTime} (Sat-Sun)
                  <br />
                  <span className="text-xs text-background/40">
                    24/7 Supervision
                  </span>
                </span>
              </li>
            </ul>

            {/* Service area */}
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-background/40 mb-2">
                Serving
              </p>
              <p className="text-xs text-background/50 leading-relaxed">
                {websiteProfile.serviceArea.join(" · ")}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-14 border-t border-background/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-background/35">
          <p>
            &copy; {currentYear} {businessName}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="focus-ring rounded-sm hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="focus-ring rounded-sm hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

