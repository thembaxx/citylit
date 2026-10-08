/** CSP permits the app's local assets, animated styles and OSM tiles, not arbitrary scripts. */
export function contentSecurityPolicy({
  nonce,
  development = false,
}: {
  nonce?: string;
  development?: boolean;
} = {}) {
  const scripts = [
    "'self'",
    ...(nonce ? [`'nonce-${nonce}'`, "'strict-dynamic'"] : []),
    ...(development ? ["'unsafe-eval'"] : []),
  ];
  return [
    "default-src 'self'",
    `script-src ${scripts.join(" ")}`,
    "script-src-attr 'none'",
    // Motion, GSAP, Three.js and MapLibre update style attributes during gestures.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://tile.openstreetmap.org",
    "font-src 'self'",
    `connect-src 'self' https://tile.openstreetmap.org${development ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join("; ");
}
