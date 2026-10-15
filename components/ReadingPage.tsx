import type { ReactNode } from "react";
import Link from "next/link";
import GuideShell from "./GuideShell";
export default function ReadingPage({ children }: { children: ReactNode }) {
  return (
    <GuideShell>
      <article className="atlas-reading reading-container" id="main-content" tabIndex={-1}>
        {children}
        <footer className="reading-footer">
          <Link href="/destinations">City guides</Link>
          <Link href="/about">About &amp; sources</Link>
          <Link href="/privacy">Privacy &amp; data</Link>
          <a href="https://github.com/thembaxx/citylit/issues/new/choose">Report an issue</a>
        </footer>
      </article>
    </GuideShell>
  );
}
