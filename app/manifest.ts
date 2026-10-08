import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Citylit — Every city has a spark.",
    short_name: "Citylit",
    description:
      "Follow a little curiosity. Explore South Africa with Khwezi and keep a day of discoveries.",
    id: "/",
    scope: "/",
    lang: "en-ZA",
    start_url: "/",
    categories: ["travel", "entertainment", "lifestyle"],
    shortcuts: [
      {
        name: "Discover South Africa",
        short_name: "Discover",
        url: "/",
        icons: [{ src: "/brand/app-icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Build a day",
        short_name: "My day",
        url: "/explore?tab=day",
        icons: [{ src: "/brand/app-icon-192.png", sizes: "192x192" }],
      },
      {
        name: "My passport",
        short_name: "Passport",
        url: "/explore?tab=passport",
        icons: [{ src: "/brand/app-icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Offline pocket guide",
        short_name: "Offline",
        url: "/offline.html",
        icons: [{ src: "/brand/app-icon-192.png", sizes: "192x192" }],
      },
    ],
    screenshots: [
      {
        src: "/brand/pwa-discover-phone.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Spin South Africa’s province map and discover a city",
      },
      {
        src: "/brand/pwa-durban-wide.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
        label: "Explore Durban’s interactive landmark chapter",
      },
    ],
    display: "standalone",
    share_target: {
      action: "/explore",
      method: "GET",
      enctype: "application/x-www-form-urlencoded",
      params: { url: "shared-url", text: "shared-text", title: "shared-title" },
    },
    background_color: "#080f20",
    theme_color: "#080f20",
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
