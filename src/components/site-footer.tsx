/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { siteConfig } from "@/config/site";
import {
  Facebook,
  Instagram,
  Twitter,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Social */}
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🐾</span>
              <span className="font-bold text-lg">Zaine's Stay & Play</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Private, safety-first dog boarding in Syracuse with three suite
              options and owner-led care.
            </p>
            <div className="flex gap-3">
              <Link
                href={siteConfig.links.facebook}
                className="text-muted-foreground hover:text-foreground"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href={siteConfig.links.instagram}
                className="text-muted-foreground hover:text-foreground"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href={siteConfig.links.twitter}
                className="text-muted-foreground hover:text-foreground"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Boarding */}
          <div>
            <h3 className="font-semibold mb-4">Boarding</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/suites"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Suite Options
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/book"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Book Now
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/reviews"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Reviews
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-muted-foreground hover:text-foreground"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/policies"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Policies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {siteConfig.contact.address}
                  <br />
                  {siteConfig.contact.city}, {siteConfig.contact.state}{" "}
                  {siteConfig.contact.zip}
                </span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <a
                  href={`tel:${siteConfig.contact.phone}`}
                  className="hover:text-foreground"
                >
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="hover:text-foreground"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {siteConfig.hours.weekday}
                  <br />
                  {siteConfig.hours.available}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Zaine's Stay & Play. All rights
            reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
