import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Pawfect Stays. Visit us, call us, or send us a message. We're here to answer your questions about dog boarding, daycare, and grooming.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Get In Touch
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Information */}
            <div>
              <h2 className="mb-8 text-3xl font-bold">Contact Information</h2>
              <div className="space-y-6">
                <Card>
                  <CardContent className="flex items-start gap-4 pt-6">
                    <MapPin className="h-6 w-6 shrink-0 text-primary" />
                    <div>
                      <h3 className="mb-1 font-semibold">Visit Us</h3>
                      <p className="text-sm text-muted-foreground">
                        {siteConfig.contact.address}<br />
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
                        Mon-Fri: 6am - 8pm<br />
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
                      <p className="mt-1 text-xs text-muted-foreground">
                        We typically respond within 24 hours
                      </p>
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
                        <p className="mt-2 font-semibold text-foreground">
                          {siteConfig.hours.available}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media */}
                <div>
                  <h3 className="mb-4 font-semibold">Follow Us</h3>
                  <div className="flex gap-4">
                    <Link
                      href={siteConfig.links.facebook}
                      className="flex h-10 w-10 items-center justify-center rounded-full border bg-background hover:bg-accent"
                    >
                      <Facebook className="h-5 w-5" />
                    </Link>
                    <Link
                      href={siteConfig.links.instagram}
                      className="flex h-10 w-10 items-center justify-center rounded-full border bg-background hover:bg-accent"
                    >
                      <Instagram className="h-5 w-5" />
                    </Link>
                    <Link
                      href={siteConfig.links.twitter}
                      className="flex h-10 w-10 items-center justify-center rounded-full border bg-background hover:bg-accent"
                    >
                      <Twitter className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Send Us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we&apos;ll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="John" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Doe" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="john@example.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" type="tel" placeholder="(555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="General Inquiry" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us how we can help..."
                        className="min-h-[150px]"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-3xl font-bold">Find Us</h2>
          <div className="mx-auto max-w-4xl">
            <div className="aspect-video rounded-lg bg-muted">
              {/* Placeholder for Google Maps embed */}
              <div className="flex h-full items-center justify-center text-6xl">
                🗺️
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Located in the heart of Seattle, easily accessible from I-5 and I-90
            </p>
          </div>
        </div>
      </section>

      {/* FAQs Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Have Questions?</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Check out our frequently asked questions for quick answers
          </p>
          <Button asChild size="lg">
            <Link href="/faq">View FAQ</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
