import type { NextConfig } from "next";
const releaseSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "";
const config: NextConfig = {
  // A public commit identifier, never a credential; compiled into the release being checked.
  env: { CITYLIT_RELEASE_SHA: /^[a-f0-9]{40}$/.test(releaseSha) ? releaseSha : "" },
  outputFileTracingIncludes: {
    "/share/\\[\\[\\.\\.\\.path\\]\\]": ["./public/images/*.jpg", "./public/app-icon.svg"],
  },
  poweredByHeader: false,
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
            value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
          },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};
export default config;
