import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { siteConfig } from "@/config/site";
import { localBusinessSchema } from "@/lib/structured-data";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Luxury Dog Boarding Syracuse NY | Zaine's Stay & Play",
    template: `%s | Zaine's Stay & Play`,
  },
  description:
    "Private boutique dog boarding in Syracuse, NY. Only 3 suites, owner always on-site, camera-monitored, cage-free. Serving Syracuse, Liverpool, Cicero, Baldwinsville & surrounding areas.",
  keywords: [
    "dog boarding Syracuse NY",
    "luxury dog boarding Syracuse",
    "private dog boarding Syracuse",
    "overnight dog boarding Syracuse",
    "boutique dog boarding",
    "cage-free dog boarding",
    "dog boarding Clay NY",
    "dog boarding Cicero NY",
    "dog boarding Baldwinsville NY",
    "owner on site dog boarding",
    "small capacity dog boarding",
    "private dog boarding",
  ],
  authors: [{ name: "Zaine's Stay & Play", url: siteConfig.url }],
  creator: "Zaine's Stay & Play",
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: "Luxury Dog Boarding Syracuse NY | Zaine's Stay & Play",
    description:
      "Private boutique dog boarding in Syracuse. Only 3 suites, owner always on-site, camera-monitored 24/7. Your dog's home away from home.",
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "Zaine's Stay & Play — Private Dog Boarding Syracuse NY",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luxury Dog Boarding Syracuse NY | Zaine's Stay & Play",
    description:
      "Private boutique dog boarding in Syracuse. Only 3 suites, owner always on-site, camera-monitored 24/7.",
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localBusinessJsonLd = await localBusinessSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${dmSans.variable} font-sans antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd),
          }}
        />
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
