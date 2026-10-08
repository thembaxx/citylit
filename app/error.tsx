"use client";
import Link from "next/link";
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="recovery-page">
      <span className="tiny-label">CITYLIT / A MOMENT TO REGROUP</span>
      <h1>A spark went astray.</h1>
      <p>
        Try this chapter again, or return to the map. Your saved discoveries remain on this browser.
      </p>
      <nav className="reading-links">
        <button className="pill-button" onClick={retry}>
          Try again
        </button>
        <Link href="/">Back to the map</Link>
        <a href="/offline.html">Open the downloaded guide</a>
      </nav>
    </main>
  );
}
