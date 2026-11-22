import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Stellar ecosystem analytics",
  description: "Web and API analytics for Stellar ecosystem projects.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const trackerWebsiteId = process.env.UMAMI_TRACKER_WEBSITE_ID?.trim();
  const trackerDomains = process.env.UMAMI_TRACKER_DOMAINS?.trim();

  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <head>
        {/* The console already has a dark theme. Keep Dark Reader from rewriting it before hydration. */}
        <meta name="darkreader-lock" />
        {trackerWebsiteId && trackerDomains && (
          <script
            defer
            src="https://cloud.umami.is/script.js"
            data-performance="true"
            data-website-id={trackerWebsiteId}
            data-domains={trackerDomains}
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
