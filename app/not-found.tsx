import Link from "next/link";
import type { Metadata } from "next";
import KhweziMoment from "../components/KhweziMoment";
export const metadata: Metadata = {
  title: "A little detour | Citylit",
  robots: { index: false, follow: true },
};
export default function NotFound() {
  return (
    <main className="recovery-page">
      <span className="tiny-label">CITYLIT / 404</span>
      <h1>A little detour.</h1>
      <p>This chapter doesn’t exist. Your next discovery is still out there.</p>
      <KhweziMoment pose="search" />
      <nav className="reading-links">
        <Link href="/" className="pill-button">
          Back to the map
        </Link>
        <Link href="/destinations">Browse city guides</Link>
      </nav>
    </main>
  );
}
