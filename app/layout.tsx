import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./discovery-guide.css";
import "./native-refinement.css";
import "./spacing-system.css";
import "./mobile-ux.css";
import "./native-shell.css";
import "./unified-design-system.css";
import "./reference-redesign.css";
import PwaProvider from "../components/PwaProvider";
import AppStatus from "../components/AppStatus";
import SceneCanvas from "../components/SceneCanvas";
import KhweziProvider from "../components/KhweziProvider";
import JsonLd from "../components/JsonLd";
import JourneyTransition from "../components/JourneyTransition";
import { SITE_URL, websiteSchema, isPreview } from "../lib/seo";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#121317" },
  ],
  colorScheme: "dark light",
};
export const metadata: Metadata = {
  appleWebApp: { capable: true, title: "Citylit", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  metadataBase: new URL(SITE_URL),
  applicationName: "Citylit",
  robots: { index: !isPreview, follow: !isPreview },
  title: "Citylit — Follow your curiosity.",
  description:
    "Explore South Africa’s cities, landmarks, local places and stories in a tactile 3D atlas. Follow what interests you and build a day around it.",
  icons: {
    icon: [
      { url: "/app-icon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", sizes: "32x32" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: "Citylit — Follow your curiosity.",
    description:
      "Discover South Africa’s cities, landmarks and local stories in a living 3D atlas.",
    images: [
      {
        url: "/brand/social-card.png",
        width: 1200,
        height: 630,
        alt: "Citylit — Interactive 3D and Field Guide to South Africa.",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/brand/social-card.png"] },
};
export default async function Layout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") || undefined;
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
      <head>
        <link rel="stylesheet" href="/theme.css" />
        {/* Deliberately parser-blocking: a deferred script cannot prevent a wrong-theme paint. */}
        <script nonce={nonce} src="/theme.js" />
      </head>
      <body>
        <JsonLd value={websiteSchema()} />
        <PwaProvider>
          <SceneCanvas>
            <KhweziProvider>
              {children}
              <AppStatus />
              <Suspense fallback={null}>
                <JourneyTransition />
              </Suspense>
            </KhweziProvider>
          </SceneCanvas>
        </PwaProvider>
        <Analytics />
      </body>
    </html>
  );
}
