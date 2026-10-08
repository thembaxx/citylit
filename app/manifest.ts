import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Citylit — discovery field guide",
    short_name: "Citylit",
    description: "Explore South African destinations and keep a day of discoveries.",
    start_url: "/",
    display: "standalone",
    background_color: "#091323",
    theme_color: "#091323",
    icons: [{ src: "/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
