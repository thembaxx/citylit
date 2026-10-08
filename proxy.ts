import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy } from "./lib/security-policy";
export function proxy(request: NextRequest) {
  const nonce = randomBytes(24).toString("base64");
  const policy = contentSecurityPolicy({
    nonce,
    development: process.env.NODE_ENV === "development",
  });
  const requestHeaders = new Headers(request.headers);
  // Never trust a caller-provided nonce or CSP. Next.js reads these to nonce its runtime.
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  // HTML only. Public catalog, Markdown, static images and optimization remain cacheable.
  matcher: [
    "/((?!api(?:/|$)|_next/|guides(?:/|$)|share(?:/|$)|data/|images/|brand/|fonts/|.*\\.(?:txt|xml|html|js|css|woff2|svg|png|jpg|ico|webmanifest)$).*)",
  ],
};
