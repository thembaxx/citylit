"use client";
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Let’s regroup | Citylit</title>
        <meta name="robots" content="noindex" />
      </head>
      <body
        style={{
          margin: 0,
          padding: "max(32px, env(safe-area-inset-top)) 24px",
          background: "#091323",
          color: "#F3EFE3",
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
              background: "#F3EFE3",
              color: "#17243C",
              borderRadius: 20,
              border: 0,
            }}
          >
            Try again
          </button>
          <p>
            <a href="/" style={{ color: "#C7C0FF" }}>
              Return to Citylit
            </a>{" "}
            ·{" "}
            <a href="/offline.html" style={{ color: "#C7C0FF" }}>
              Downloaded guide
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
