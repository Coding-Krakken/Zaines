import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { localBusinessSchema } from "@/lib/structured-data";
import { rootMetadataFromSettings } from "@/lib/seo";

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

export async function generateMetadata(): Promise<Metadata> {
  return rootMetadataFromSettings();
}

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
        <Script id="console-filter-early" strategy="beforeInteractive">
          {`(function(){
  try {
    var warn = console.warn;
    var error = console.error;
    var patterns = [
      /Default export is deprecated.*zustand/i,
      /import.*create.*from.*zustand/i,
      /\[DEPRECATED\].*zustand/i,
      /E353.*csPostMessage.*timeout/i,
      /csPostMessage.*timeout/i
    ];
    function shouldSuppress(message){
      var text = String(message || "");
      for (var i = 0; i < patterns.length; i += 1) {
        if (patterns[i].test(text)) return true;
      }
      return false;
    }
    console.warn = function(message){
      if (shouldSuppress(message)) return;
      return warn.apply(console, arguments);
    };
    console.error = function(message){
      if (shouldSuppress(message)) return;
      return error.apply(console, arguments);
    };
  } catch (e) {
    // noop
  }
})();`}
        </Script>
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
        <Analytics />
      </body>
    </html>
  );
}
