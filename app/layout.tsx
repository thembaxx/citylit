import type { Metadata } from "next";
import "./globals.css";
import OfflineSupport from "../components/OfflineSupport";
import SceneCanvas from "../components/SceneCanvas";
export const metadata: Metadata = {
  title: "Citylit — A little curiosity. A whole country.",
  description:
    "Play your way through South Africa. Discover twelve South African destinations in an interactive 3D atlas and build your own day.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OfflineSupport />
        <SceneCanvas>{children}</SceneCanvas>
      </body>
    </html>
  );
}
