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
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <head>
        {/* The console already has a dark theme. Keep Dark Reader from rewriting it before hydration. */}
        <meta name="darkreader-lock" />
        <script defer src="https://cloud.umami.is/script.js" data-performance="true" data-website-id="ba460156-97f2-48e5-b533-7a784619d6c5"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
