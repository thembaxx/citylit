import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaProvider from "../components/PwaProvider";
import AppStatus from "../components/AppStatus";
import SceneCanvas from "../components/SceneCanvas";
import KhweziProvider from "../components/KhweziProvider";
import JsonLd from "../components/JsonLd";
import { SITE_URL, websiteSchema, isPreview } from "../lib/seo";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#080f20",
  colorScheme: "dark light",
};
export const metadata: Metadata = {
  appleWebApp: { capable: true, title: "Citylit", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  metadataBase: new URL(SITE_URL),
  applicationName: "Citylit",
  robots: { index: !isPreview, follow: !isPreview },
  title: "Citylit — Every city has a spark.",
  description:
    "Play your way through South Africa. Discover twelve South African destinations in an interactive 3D atlas and build your own day.",
  icons: {
    icon: [
      { url: "/app-icon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", sizes: "32x32" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: "Citylit — Every city has a spark.",
    description:
      "Follow a little curiosity. Discover South Africa with Khwezi, your playful 3D guide.",
    images: [
      {
        url: "/brand/social-card.png",
        width: 1200,
        height: 630,
        alt: "Khwezi the springhare — Every city has a spark.",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/brand/social-card.png"] },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <JsonLd value={websiteSchema()} />
        <PwaProvider>
          <SceneCanvas>
            <KhweziProvider>
              {children}
              <AppStatus />
            </KhweziProvider>
          </SceneCanvas>
        </PwaProvider>
      </body>
    </html>
  );
}
