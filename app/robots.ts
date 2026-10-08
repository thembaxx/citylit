import type { MetadataRoute } from "next";
import { SITE_URL, isPreview } from "../lib/seo";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      ...(isPreview
        ? { disallow: "/" }
        : { allow: "/", disallow: ["/editorial", "/api/", "/offline.html"] }),
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
