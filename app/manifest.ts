import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Citylit — Every city has a spark.",
    short_name: "Citylit",
    description:
      "Follow a little curiosity. Explore South Africa with Khwezi and keep a day of discoveries.",
    start_url: "/",
    display: "standalone",
    background_color: "#091323",
    theme_color: "#091323",
    icons: [
      { src: "/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/brand/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/brand/app-icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
