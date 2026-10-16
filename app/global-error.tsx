"use client";
import { recoveryThemeScript } from "../lib/recovery-theme";
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Let’s regroup | Citylit</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="dark light" />
        <meta name="theme-color" content="#f4efe6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0e0f13" media="(prefers-color-scheme: dark)" />
        <script
          data-citylit-recovery-theme
          dangerouslySetInnerHTML={{ __html: recoveryThemeScript }}
        />
        <link rel="stylesheet" href="/theme.css" />
      </head>
      <body
        style={{
          margin: 0,
          padding:
            "max(32px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(32px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left))",
          background: "var(--bg, #0e0f13)",
          color: "var(--ink, #f3eee4)",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          overflow: "auto",
        }}
      >
        <main>
          <h1>A spark went astray.</h1>
          <p>
            Try again, or use your downloaded field guide. Your browser’s saved discoveries have not
            been cleared.
          </p>
          <button
            onClick={retry}
            style={{
              font: "inherit",
              fontSize: 16,
              padding: "14px 20px",
              background: "var(--ink, #f3eee4)",
              color: "var(--bg, #0e0f13)",
              borderRadius: 20,
              border: 0,
            }}
          >
            Try again
          </button>
          <p>
            <a href="/" style={{ color: "var(--accent-ink, #f4ca83)" }}>
              Return to Citylit
            </a>{" "}
            ·{" "}
            <a href="/offline.html" style={{ color: "var(--accent-ink, #f4ca83)" }}>
              Downloaded guide
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
