import type { ReactNode } from "react";
import Link from "next/link";
import BrandWordmark from "./BrandWordmark";
import ThemeToggle from "./ThemeToggle";
export default function ReadingPage({ children }: { children: ReactNode }) {
  return (
    <main className="reading-page" id="main-content" tabIndex={-1}>
      <div className="reading-container">
        <header className="reading-nav">
          <Link href="/" aria-label="Citylit home">
            <BrandWordmark />
          </Link>
          <div>
            <ThemeToggle />
            <Link href="/">Back to discovery</Link>
          </div>
        </header>
        {children}
        <footer className="reading-footer">
          <Link href="/destinations">City guides</Link>
          <Link href="/about">About & sources</Link>
          <Link href="/privacy">Privacy & data</Link>
          <a href="https://github.com/thembaxx/citylit/issues/new/choose">Report an issue</a>
        </footer>
      </div>
    </main>
  );
}
