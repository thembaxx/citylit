"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";
import BrandWordmark from "./BrandWordmark";
import KhweziMark from "./KhweziMark";
import KhweziMoment from "./KhweziMoment";
import ThemeToggle from "./ThemeToggle";
import { brand, khweziMoments, type KhweziPose } from "../lib/brand";
const KhweziView = dynamic(() => import("./KhweziView"), {
  ssr: false,
  loading: () => <KhweziMark pose="welcome" />,
});
export default function BrandStudio() {
  const [pose, setPose] = useState<KhweziPose>("welcome"),
    [yaw, setYaw] = useState(0.2),
    [turnReset, setTurnReset] = useState(0),
    [accent, setAccent] = useState<string>(brand.colors.electric);
  return (
    <main className="brand-page">
      <header className="brand-page-nav">
        <Link href="/" aria-label="Citylit home">
          <BrandWordmark />
        </Link>
        <div>
          <ThemeToggle />
          <Link href="/">
            <ArrowLeft size={14} />
            Back to discovery
          </Link>
        </div>
      </header>
      <header className="brand-heading">
        <span className="tiny-label">CITYLIT / BRAND FIELD NOTES / I</span>
        <h1>
          Every city
          <br />
          has a spark.
        </h1>
        <p>Small adventures. A little wonder. A whole country waiting to be discovered.</p>
      </header>
      <section className="brand-character" aria-labelledby="khwezi-title">
        <div className="brand-character-stage">
          <KhweziView pose={pose} yaw={yaw} accent={accent} reset={turnReset} />
          <span className="brand-stage-caption">Drag Khwezi to turn · arrow keys work too</span>
        </div>
        <div className="brand-character-story">
          <span className="tiny-label">YOUR CURIOUS COMPANION</span>
          <h2 id="khwezi-title">Meet Khwezi.</h2>
          <p>{brand.story} A luminous diamond, enormous ears and a pocket full of possibility.</p>
          <p>
            The ears do the talking. The glow follows the city. Every saved place becomes a spark to
            carry with you.
          </p>
          <div className="brand-pose-picker" aria-label="Khwezi moments">
            {Object.keys(khweziMoments).map((key) => (
              <button
                key={key}
                aria-pressed={pose === key}
                onClick={() => setPose(key as KhweziPose)}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="brand-view-picker" aria-label="Character view">
            {[
              ["Front", 0],
              ["Three-quarter", 0.6],
              ["Side", Math.PI / 2],
            ].map(([label, angle]) => (
              <button
                key={label}
                aria-pressed={yaw === angle}
                onClick={() => {
                  setYaw(Number(angle));
                  setTurnReset((value) => value + 1);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="brand-glow-picker">
            A little local colour
            <select value={accent} onChange={(e) => setAccent(e.target.value)}>
              <option value={brand.colors.electric}>Citylit electric</option>
              <option value="#E6B75A">Joburg amber</option>
              <option value="#62BAFF">Cape Town sea</option>
              <option value="#5BDABE">Durban tide</option>
            </select>
          </label>
        </div>
      </section>
      <section className="brand-section" aria-labelledby="brand-shapes">
        <span className="tiny-label">II / RECOGNISABLE FROM EVERY ANGLE</span>
        <h2 id="brand-shapes">A little character.</h2>
        <div className="brand-turnarounds">
          <figure>
            <KhweziView yaw={0} index={4} />
            <figcaption>Front · the diamond and ears</figcaption>
          </figure>
          <figure>
            <KhweziView yaw={Math.PI / 2} index={5} />
            <figcaption>Side · springy feet and a long tail</figcaption>
          </figure>
          <figure>
            <div className="brand-icon-example">
              <img src="/app-icon.svg" width="128" height="128" alt="Khwezi app icon" />
            </div>
            <figcaption>A face for your home screen</figcaption>
          </figure>
        </div>
      </section>
      <section className="brand-section" aria-labelledby="brand-colour">
        <span className="tiny-label">III / DAYLIGHT & LITTLE NIGHT ADVENTURES</span>
        <h2 id="brand-colour">Our kind of light.</h2>
        <p>
          Ivory and ink give the stories room. Electric blue means an invitation; blush adds warmth.
          Province colours stay their own.
        </p>
        <div className="brand-swatches">
          {Object.entries(brand.colors).map(([name, color]) => (
            <div key={name}>
              <i style={{ background: color }} />
              <strong>{name}</strong>
              <code>{color}</code>
            </div>
          ))}
        </div>
        <div className="brand-theme-examples">
          <div className="brand-day-example">
            <BrandWordmark />
            <KhweziMark pose="welcome" />
            <strong>Follow a little curiosity.</strong>
            <p>Warm daylight. Somewhere worth finding.</p>
          </div>
          <div className="brand-night-example">
            <BrandWordmark />
            <KhweziMark pose="offline" />
            <strong>Your sparks travel with you.</strong>
            <p>A quiet night. A small light to follow.</p>
          </div>
        </div>
      </section>
      <section className="brand-section" aria-labelledby="brand-voice">
        <span className="tiny-label">IV / SMALL MOMENTS, REAL PURPOSE</span>
        <h2 id="brand-voice">A friendly little nudge.</h2>
        <div className="brand-ui-moments">
          <KhweziMoment pose="welcome" />
          <KhweziMoment pose="saved" />
          <KhweziMoment pose="search" />
        </div>
        <p>
          Curious, warm and slightly surreal. Brief celebrations, useful hints and a quiet default.
          Sound is opt-in; reduced motion gets an expressive still pose.
        </p>
      </section>
      <footer className="brand-downloads">
        <h2>Take a spark with you.</h2>
        <p>Original Citylit assets and a shareable concept sheet.</p>
        <div>
          <a href="/brand/wordmark.svg" download>
            <Download size={15} />
            Wordmark SVG
          </a>
          <a href="/brand/khwezi.svg" download>
            <Download size={15} />
            Khwezi SVG
          </a>
          <a href="/brand/app-icon-512.png" download>
            <Download size={15} />
            App icon
          </a>
          <a href="/brand/concept-sheet.png" download>
            <Download size={15} />
            Concept sheet
          </a>
          <button onClick={() => window.print()}>
            <Printer size={15} />
            Print field notes
          </button>
        </div>
      </footer>
      <div hidden>
        <KhweziMark pose="idle" />
      </div>
    </main>
  );
}
