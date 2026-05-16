import type { Metadata } from "next";
import { Fredoka, Nunito_Sans } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { localBusinessSchema } from "@/lib/structured-data";
import { rootMetadataFromSettings } from "@/lib/seo";
import { SkipLinks } from "@/components/accessibility/SkipLinks";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-nunito-sans",
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
      <head>
        {/* Critical resource hints for external services */}
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${fredoka.variable} ${nunitoSans.variable} font-sans antialiased`}
      >
        <SkipLinks />
        <Script id="console-filter-early" strategy="beforeInteractive">
          {`(function(){
  try {
    var warn = console.warn;
    var error = console.error;
    var log = console.log;
    var patterns = [
      /\[DEPRECATED\].*Default export is deprecated/i,
      /Default export is deprecated/i,
      /Default export is deprecated.*zustand/i,
      /import.*create.*from.*zustand/i,
      /import\s*\{\s*create\s*\}\s*from\s*['\"]zustand['\"]/i,
      /\[DEPRECATED\].*zustand/i,
      /E353.*csPostMessage.*timeout/i,
      /csPostMessage.*timeout/i,
      /preloaded using link preload but not used within a few seconds/i,
      /Your Elements integration is using an older API/i
    ];
    function shouldSuppress(args){
      var text = Array.prototype.map.call(args, function(part){
        return String(part == null ? "" : part);
      }).join(" ");
      for (var i = 0; i < patterns.length; i += 1) {
        if (patterns[i].test(text)) return true;
      }
      return false;
    }
    console.warn = function(){
      if (shouldSuppress(arguments)) return;
      return warn.apply(console, arguments);
    };
    console.error = function(){
      if (shouldSuppress(arguments)) return;
      return error.apply(console, arguments);
    };
    console.log = function(){
      if (shouldSuppress(arguments)) return;
      return log.apply(console, arguments);
    };
    window.addEventListener('unhandledrejection', function(event){
      var reason = String(event && event.reason ? event.reason : '');
      if (/E353.*csPostMessage.*timeout/i.test(reason) || /csPostMessage.*timeout/i.test(reason)) {
        event.preventDefault();
      }
    }, true);
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
            <main id="main-content" className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          <Toaster />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
