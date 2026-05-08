import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, Clock } from "lucide-react";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background/70">
      <div className="container py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2.5 mb-5 group w-fit"
              aria-label="Zaine's Stay & Play — Home"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm">
                🐾
              </span>
              <span className="font-display text-lg font-semibold text-background tracking-tight">
                Zaine&apos;s Stay &amp; Play
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
                href={siteConfig.links.facebook}
                aria-label="Zaine's Stay & Play on Facebook"
                className="text-background/40 hover:text-primary transition-colors"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Facebook className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={siteConfig.links.instagram}
                aria-label="Zaine's Stay & Play on Instagram"
                className="text-background/40 hover:text-primary transition-colors"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={siteConfig.links.twitter}
                aria-label="Zaine's Stay & Play on X (Twitter)"
                className="text-background/40 hover:text-primary transition-colors"
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
                    className="hover:text-primary transition-colors"
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
                    className="hover:text-primary transition-colors"
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
                      {siteConfig.contact.address}
                    </span>
                    <br />
                    <span itemProp="addressLocality">
                      {siteConfig.contact.city}
                    </span>
                    ,{" "}
                    <span itemProp="addressRegion">
                      {siteConfig.contact.state}
                    </span>{" "}
                    <span itemProp="postalCode">{siteConfig.contact.zip}</span>
                  </span>
                </address>
              </li>
              <li className="flex items-center gap-2">
                <Phone
                  className="h-3.5 w-3.5 flex-shrink-0 text-primary/70"
                  aria-hidden="true"
                />
                <a
                  href={`tel:${siteConfig.contact.phone}`}
                  className="hover:text-primary transition-colors"
                  itemProp="telephone"
                >
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail
                  className="h-3.5 w-3.5 flex-shrink-0 text-primary/70"
                  aria-hidden="true"
                />
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="hover:text-primary transition-colors break-all"
                  itemProp="email"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock
                  className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary/70"
                  aria-hidden="true"
                />
                <span>
                  {siteConfig.hours.weekday}
                  <br />
                  <span className="text-xs text-background/40">
                    {siteConfig.hours.available}
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
                {siteConfig.serviceArea.join(" · ")}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-14 border-t border-background/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-background/35">
          <p>
            &copy; {currentYear} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

