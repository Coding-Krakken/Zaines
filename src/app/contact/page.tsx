import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from "lucide-react";
import Link from "next/link";
import { ContactSubmissionForm } from "@/app/contact/components/ContactSubmissionForm";

export const metadata: Metadata = {
  title: "Contact | Zaine's Stay & Play",
  description:
    "Get in touch with Zaine's Stay & Play. Visit us, call us, or send us a message about private dog boarding, suite availability, and care policies.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-br from-primary/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">Get In Touch</h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-8 text-3xl font-bold">Contact Information</h2>
              <div className="space-y-6">
                <Card>
                  <CardContent className="flex items-start gap-4 pt-6">
                    <MapPin className="h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <h3 className="mb-1 font-semibold">Visit Us</h3>
                      <p className="text-sm text-muted-foreground">
                        {siteConfig.contact.address}
                        <br />
                        {siteConfig.contact.city}, {siteConfig.contact.state} {siteConfig.contact.zip}
                      </p>
                      <Button variant="link" className="mt-2 h-auto p-0" asChild>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(`${siteConfig.contact.address}, ${siteConfig.contact.city}, ${siteConfig.contact.state} ${siteConfig.contact.zip}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Get Directions →
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-start gap-4 pt-6">
                    <Phone className="h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <h3 className="mb-1 font-semibold">Call Us</h3>
                      <p className="text-sm text-muted-foreground">
                        <a href={`tel:${siteConfig.contact.phone}`} className="hover:text-foreground">
                          {siteConfig.contact.phone}
                        </a>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Mon-Fri: 6am - 8pm
                        <br />
                        Sat-Sun: 8am - 6pm
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-start gap-4 pt-6">
                    <Mail className="h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <h3 className="mb-1 font-semibold">Email Us</h3>
                      <p className="text-sm text-muted-foreground">
                        <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-foreground">
                          {siteConfig.contact.email}
                        </a>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">We typically respond within 24 hours</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-start gap-4 pt-6">
                    <Clock className="h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <h3 className="mb-1 font-semibold">Hours of Operation</h3>
                      <div className="text-sm text-muted-foreground">
                        <p>Monday - Friday: {siteConfig.hours.weekday}</p>
                        <p>Saturday - Sunday: {siteConfig.hours.weekend}</p>
                        <p className="mt-2 font-semibold text-foreground">{siteConfig.hours.available}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <h3 className="mb-4 font-semibold">Follow Us</h3>
                  <div className="flex gap-4">
                    <Link href={siteConfig.links.facebook} className="flex h-10 w-10 items-center justify-center rounded-full border bg-background hover:bg-accent">
                      <Facebook className="h-5 w-5" />
                    </Link>
                    <Link href={siteConfig.links.instagram} className="flex h-10 w-10 items-center justify-center rounded-full border bg-background hover:bg-accent">
                      <Instagram className="h-5 w-5" />
                    </Link>
                    <Link href={siteConfig.links.twitter} className="flex h-10 w-10 items-center justify-center rounded-full border bg-background hover:bg-accent">
                      <Twitter className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <ContactSubmissionForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
