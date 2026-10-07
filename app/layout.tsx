import type { Metadata } from "next";
import "./globals.css";
import SceneCanvas from "../components/SceneCanvas";
export const metadata: Metadata = {
  title: "Citylit — A little curiosity. A whole country.",
  description:
    "Play your way through South Africa. Discover Johannesburg, Cape Town and Durban in an interactive 3D atlas.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SceneCanvas>{children}</SceneCanvas>
      </body>
    </html>
  );
}
