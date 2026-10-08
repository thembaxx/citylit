import type { NextConfig } from "next";
import { contentSecurityPolicy } from "./lib/security-policy";
const releaseSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "";
const config: NextConfig = {
  // A public commit identifier, never a credential; compiled into the release being checked.
  env: { CITYLIT_RELEASE_SHA: /^[a-f0-9]{40}$/.test(releaseSha) ? releaseSha : "" },
  outputFileTracingIncludes: {
    "/share/\\[\\[\\.\\.\\.path\\]\\]": ["./public/images/*.jpg", "./public/app-icon.svg"],
  },
  poweredByHeader: false,
  images: {
    localPatterns: [{ pathname: "/images/*", search: "" }],
    remotePatterns: [],
    maximumRedirects: 0,
    dangerouslyAllowSVG: false,
    dangerouslyAllowLocalIP: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy(),
          },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
      {
        source: "/:worker(sw.js|pwa-release.js)",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};
export default config;
