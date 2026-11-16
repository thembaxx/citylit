"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  BracketsCurly,
  Browser,
  CaretDown,
  ChatCircleDots,
  Check,
  Circle,
  Code,
  Copy,
  GithubLogo,
  List,
  MagnifyingGlass,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Sparkle,
  TextAa,
  Waveform,
  X,
} from "@phosphor-icons/react";

type ProofKey = "polish" | "distill" | "clarify";

const PROOFS: Record<
  ProofKey,
  { label: string; aria: string; before: ReactNode; after: ReactNode }
> = {
  polish: {
    label: "/polish",
    aria: "/polish Remove the tells",
    before: (
      <>
        <span className="ip-tag ip-tag--note">AI kicker</span>
        <span className="ip-tag ip-tag--note ip-tag--2">Italic serif</span>
        <span className="ip-tag ip-tag--note ip-tag--3">Side-tab border</span>
        <span className="ip-tag ip-tag--note ip-tag--4">AI beige</span>
        <div className="ip-proof-top">
          <span>LAUNCH / 14</span>
          <span className="ip-live">
            <i /> On track
          </span>
        </div>
        <div className="ip-proof-body">
          <span className="ip-micro">RELEASE PLANNING</span>
          <p className="ip-proof-title">
            <em>Ship the launch plan by Friday.</em>
          </p>
          <p className="ip-proof-desc">Owners, dependencies, and decisions in one view.</p>
          <div className="ip-bar">
            <i />
          </div>
          <div className="ip-proof-foot">
            <span>8 of 11 decisions closed</span>
            <b>Review plan →</b>
          </div>
        </div>
      </>
    ),
    after: (
      <>
        <div className="ip-proof-top">
          <span>Launch / 14</span>
          <span className="ip-track">
            <i /> On track
          </span>
        </div>
        <div className="ip-proof-body">
          <h3>Ship the launch plan by Friday.</h3>
          <p className="ip-proof-desc">Owners, dependencies, and decisions in one view.</p>
          <div className="ip-bar">
            <i />
          </div>
          <div className="ip-proof-foot">
            <span>8 of 11 decisions closed</span>
            <b>Review plan →</b>
          </div>
        </div>
      </>
    ),
  },
  distill: {
    label: "/distill",
    aria: "/distill Find the hierarchy",
    before: (
      <>
        <span className="ip-tag ip-tag--note">Status-chip soup</span>
        <span className="ip-tag ip-tag--note ip-tag--2">Everything equal</span>
        <span className="ip-tag ip-tag--note ip-tag--3">Cards in cards</span>
        <div className="ip-proof-top">
          <strong>Analytics overview</strong>
          <span className="ip-live">Live</span>
        </div>
        <div className="ip-metric-grid">
          {[
            ["Revenue", "$84.2k", "+12%"],
            ["Orders", "1,248", "+8%"],
            ["Visitors", "18.4k", "+21%"],
            ["Conversion", "3.8%", "+4%"],
          ].map(([k, v, d]) => (
            <div key={k} className="ip-metric">
              <small>{k}</small>
              <b>{v}</b>
              <i>{d}</i>
            </div>
          ))}
        </div>
        <div className="ip-nested">
          <span>Weekly performance</span>
          <div>
            <i />
            <i />
            <i />
          </div>
        </div>
      </>
    ),
    after: (
      <>
        <div className="ip-proof-top">
          <strong>Revenue</strong>
          <span className="ip-track">Last 30 days</span>
        </div>
        <div className="ip-primary-metric">
          <b>$84,218</b>
          <span>+12.4% vs June</span>
        </div>
        <div className="ip-chart">
          {[42, 58, 47, 70, 62, 84, 76].map((h, i) => (
            <i key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="ip-proof-foot">
          <span>
            Orders <b>1,248</b>
          </span>
          <span>
            Conversion <b>3.8%</b>
          </span>
        </div>
      </>
    ),
  },
  clarify: {
    label: "/clarify",
    aria: "/clarify Make the task obvious",
    before: (
      <>
        <span className="ip-tag ip-tag--note">Vague headline</span>
        <span className="ip-tag ip-tag--note ip-tag--2">Too many fields</span>
        <span className="ip-tag ip-tag--note ip-tag--3">Generic CTA</span>
        <div className="ip-proof-top">
          <span>Get started</span>
          <small>All fields required</small>
        </div>
        <p className="ip-proof-title">Unlock your potential today</p>
        <div className="ip-fields">
          <i>Acme Labs</i>
          <i>Product lead</i>
          <i>Activation</i>
          <i>This quarter</i>
        </div>
        <span className="ip-cta">Continue</span>
      </>
    ),
    after: (
      <>
        <div className="ip-proof-top">
          <span>New project</span>
          <small>Step 1 of 3</small>
        </div>
        <h3>What should this project improve?</h3>
        <p className="ip-proof-desc">Choose one focus. You can add more context next.</p>
        <div className="ip-options">
          <span>Activation</span>
          <span>Retention</span>
          <span>Conversion</span>
        </div>
        <span className="ip-cta ip-cta--after">Use this focus →</span>
      </>
    ),
  },
};

const COMMANDS = [
  { group: "create", items: ["impeccable", "shape", "init", "extract", "document"] },
  { group: "evaluate", items: ["critique", "audit", "live"] },
  {
    group: "refine",
    items: ["polish", "bolder", "quieter", "distill", "clarify", "adapt", "harden", "onboard"],
  },
  { group: "simplify", items: ["distill", "clarify"] },
  { group: "harden", items: ["harden", "optimize"] },
  { group: "system", items: ["init", "extract", "document", "live", "generate"] },
];

const TESTIMONIALS = [
  ["It fucking works beautifully. It's so cool.", "Ben Davis", "@davis7"],
  ["Impeccable > Claude design", "Mertcan Yüzer", "@MertcanDYuzer"],
  [
    "Uninstall whatever frontend skill you're using. Replace it with Impeccable.",
    "Adrien Ninet",
    "@adrien_ninet",
  ],
  [
    "This is a GAMECHANGER for designing with AI. I couldn't go back to the old way after using it and it's free.",
    "Dwayne",
    "@CtrlAltDwayne",
  ],
  [
    "Impeccable is the most slept on tool for incorporating design thinking into coding workflows.",
    "Anish Acharya",
    "@illscience",
  ],
  ["This is probably what Figma Make should be.", "Ian Andrews", "@IanAndrewsDC"],
  [
    "Impeccable is hands down the best UI design skill out there. I use it daily and recommend it to others as well.",
    "Carl Rannaberg",
    "@carlrannaberg",
  ],
  [
    "It has taken my ability to ship complex and beautiful designs to another level.",
    "BowTiedGroundHog",
    "@BowTiedGroundHo",
  ],
];

const HARNESS = [
  ["OpenAI Codex", Sparkle],
  ["Claude Code", Waveform],
  ["GitHub Copilot", GithubLogo],
  ["Cursor", BracketsCurly],
  ["Gemini CLI", Sparkle],
  ["Grok Build", X],
  ["Antigravity", SlidersHorizontal],
  ["OpenCode", Code],
  ["Pi", Circle],
  ["Hermes Agent", Sparkle],
  ["Devin", ShieldCheck],
  ["Replit Agent", BracketsCurly],
] as const;

const SLOPS = [
  ["AI beige", "Warm neutral grounds that forgot the product's own palette."],
  ["Italic serif", "A display voice borrowed from every other landing page."],
  ["Side-tab border", "Coloured rules that point at nothing."],
  ["Kicker chip", "A label announcing what the heading already says."],
  ["Nested cards", "Containers inside containers, none carrying meaning."],
  ["Icon tile stack", "Three equal tiles, three equal weights, no hierarchy."],
  ["Numbered sections", "01 / 02 / 03 where sequence conveys nothing."],
  ["Pulsing dot", "Motion standing in for a status."],
];

function CommandIcon({ name }: { name: string }) {
  const map: Record<string, typeof Sparkle> = {
    choose: MagnifyingGlass,
    evaluate: ShieldCheck,
    refine: Sparkle,
    simplify: List,
    harden: ShieldCheck,
    system: SlidersHorizontal,
    polish: Sparkle,
    typeset: TextAa,
    layout: Browser,
    colorize: Palette,
    animate: Waveform,
    delight: Sparkle,
    bolder: Sparkle,
    quieter: Circle,
    overdrive: Waveform,
    distill: List,
    clarify: ChatCircleDots,
    adapt: Browser,
    harden2: ShieldCheck,
    optimize: SlidersHorizontal,
    onboard: BookOpenText,
    init: Code,
    extract: BracketsCurly,
    document: BookOpenText,
    live: Browser,
    generate: Sparkle,
    shape: SlidersHorizontal,
    audit: ShieldCheck,
  };
  const Icon = map[name] ?? Sparkle;
  return <Icon size={18} weight="light" aria-hidden="true" />;
}

export default function ImpeccableLanding() {
  const [proof, setProof] = useState<ProofKey>("polish");
  const [reveal, setReveal] = useState(40);
  const [morph, setMorph] = useState(28);
  const [navOpen, setNavOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const proofGroup = useId();
  const commandId = useId();

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText("npx impeccable install");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const proofStyle = { "--reveal": `${reveal}%` } as CSSProperties;
  const morphStyle = { "--fx-impeccable": String(morph / 100) } as CSSProperties;

  return (
    <div className="ip">
      <a className="ip-skip" href="#ip-main">
        Skip to content
      </a>

      <header className="ip-header" data-open={navOpen}>
        <div className="ip-header-inner">
          <a className="ip-brand" href="#ip-top" aria-label="Impeccable home">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M5 2.5h8.5l-8 19H5a2.5 2.5 0 0 1-2.5-2.5v-14A2.5 2.5 0 0 1 5 2.5Z" />
              <path d="M16.5 2.5H19a2.5 2.5 0 0 1 2.5 2.5v14a2.5 2.5 0 0 1-2.5 2.5H8.5Z" />
            </svg>
            <span>IMPECCABLE</span>
          </a>
          <button
            type="button"
            className="ip-menu-btn"
            aria-label={navOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            {navOpen ? <X size={20} /> : <List size={20} />}
          </button>
          <nav className="ip-nav" aria-label="Primary">
            {["Home", "Designing", "Gallery", "Docs", "Slop", "Live"].map((n, i) => (
              <a
                key={n}
                href={`#ip-${n.toLowerCase()}`}
                aria-current={i === 0 ? "page" : undefined}
                onClick={() => setNavOpen(false)}
              >
                {i === 0 && <i aria-hidden="true" />}
                {n}
              </a>
            ))}
          </nav>
          <a
            className="ip-github"
            href="https://github.com/pbakaus/impeccable"
            target="_blank"
            rel="noreferrer"
            aria-label="Impeccable on GitHub, 111k stars"
          >
            <GithubLogo size={14} weight="fill" aria-hidden="true" />
            <span>111k</span>
            <span className="ip-star" aria-hidden="true">
              ★
            </span>
          </a>
        </div>
      </header>

      <main id="ip-main">
        <section className="ip-hero" id="ip-top" aria-labelledby="ip-hero-title">
          <div className="ip-hero-grid">
            <div className="ip-proof" aria-label="Impeccable command before and after examples">
              <div className="ip-proof-stage" style={proofStyle}>
                <div className="ip-proof-layer ip-proof-before">
                  <div className="ip-proof-canvas ip-proof-before-canvas" key={`${proof}-before`}>
                    <span className="ip-side-label ip-side-before">BEFORE</span>
                    {PROOFS[proof].before}
                  </div>
                </div>
                <div
                  className="ip-proof-layer ip-proof-after"
                  style={{ clipPath: `inset(0 0 0 ${reveal}%)` }}
                >
                  <div className="ip-proof-canvas ip-proof-after-canvas" key={`${proof}-after`}>
                    <span className="ip-side-label ip-side-after">AFTER</span>
                    {PROOFS[proof].after}
                  </div>
                </div>
                <div className="ip-proof-seam" aria-hidden="true" />
                <span className="ip-proof-handle" aria-hidden="true">
                  |||
                </span>
                <input
                  className="ip-proof-range"
                  type="range"
                  min="0"
                  max="100"
                  value={reveal}
                  onChange={(e) => setReveal(Number(e.target.value))}
                  aria-label={`Reveal the improved ${PROOFS[proof].label} example`}
                />
              </div>
              <div
                className="ip-proof-tabs"
                role="tablist"
                aria-label="Preview Impeccable commands"
              >
                {(Object.keys(PROOFS) as ProofKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    id={`${proofGroup}-${key}`}
                    aria-controls={`${proofGroup}-panel`}
                    aria-selected={proof === key}
                    tabIndex={proof === key ? 0 : -1}
                    className={proof === key ? "is-active" : ""}
                    onClick={() => setProof(key)}
                    onKeyDown={(e) => {
                      const keys = Object.keys(PROOFS) as ProofKey[];
                      const idx = keys.indexOf(proof);
                      if (e.key === "ArrowRight") {
                        e.preventDefault();
                        setProof(keys[(idx + 1) % keys.length]);
                      }
                      if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        setProof(keys[(idx - 1 + keys.length) % keys.length]);
                      }
                    }}
                  >
                    {PROOFS[key].label}
                  </button>
                ))}
              </div>
              <p
                className="ip-proof-caption"
                id={`${proofGroup}-panel`}
                role="tabpanel"
                aria-labelledby={`${proofGroup}-${proof}`}
              >
                Drag the divider to compare. {PROOFS[proof].aria}.
              </p>
            </div>

            <div className="ip-hero-copy">
              <h1 id="ip-hero-title">The missing design vocabulary for agents.</h1>
              <p className="ip-lead">
                Turn AI slop into interfaces you’re proud to ship. Impeccable gives your agent the
                design expertise to build from scratch, improve what you have, and stay true to your
                design system.
              </p>
              <div className="ip-actions">
                <a className="ip-btn ip-btn--primary" href="#ip-install">
                  Install Impeccable <ArrowRight size={15} weight="bold" aria-hidden="true" />
                </a>
                <a className="ip-btn ip-btn--ghost" href="#ip-designing">
                  How it works
                </a>
              </div>
              <div className="ip-harness" aria-label="AI coding harnesses Impeccable works with">
                {HARNESS.map(([name, Icon]) => (
                  <span className="ip-harness-logo" key={name} title={name} aria-label={name}>
                    <Icon size={17} weight="light" aria-hidden="true" />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="ip-testimonials"
          id="ip-testimonials"
          aria-label="What people say about Impeccable"
        >
          <div
            className="ip-marquee"
            tabIndex={0}
            role="region"
            aria-label="Testimonials, scroll to read more"
          >
            <div className="ip-marquee-track">
              {[0, 1].map((set) => (
                <div
                  className="ip-marquee-set"
                  key={set}
                  aria-hidden={set === 1 ? true : undefined}
                >
                  {TESTIMONIALS.map(([quote, name, handle]) => (
                    <figure className="ip-quote" key={`${set}-${name}`}>
                      <blockquote>“{quote}”</blockquote>
                      <figcaption>
                        <span className="ip-coin" aria-hidden="true">
                          {name[0]}
                        </span>
                        <span>
                          <cite>{name}</cite>
                          <small>{handle}</small>
                        </span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ip-section ip-slop" id="ip-slop" aria-labelledby="ip-slop-title">
          <div className="ip-section-head">
            <h2 id="ip-slop-title">Detects and removes AI slop.</h2>
            <p>
              <b>62 checks ↗</b> catch the defaults agents keep reaching for before they become your
              design.
            </p>
          </div>
          <div className="ip-slop-marquee" aria-label="Examples of AI slop patterns">
            {SLOPS.map(([name, desc]) => (
              <article className="ip-slop-card" key={name}>
                <span className="ip-slop-chip">{name}</span>
                <p>{desc}</p>
              </article>
            ))}
          </div>
          <div className="ip-slop-status">
            <span className="ip-status-dot" /> Detector on
          </div>
        </section>

        <section className="ip-section ip-start" id="ip-designing" aria-labelledby="ip-start-title">
          <div className="ip-section-head">
            <h2 id="ip-start-title">Start with what you want to change.</h2>
            <p>Describe what you want. Impeccable brings the design expertise.</p>
          </div>
          <div className="ip-command-grid">
            <div className="ip-command-demo">
              <div className="ip-command-bar" aria-label="Example commands">
                {[
                  "typeset",
                  "layout",
                  "colorize",
                  "animate",
                  "delight",
                  "bolder",
                  "quieter",
                  "overdrive",
                ].map((c) => (
                  <button type="button" key={c} onClick={() => setMorph((v) => (v < 40 ? 78 : 28))}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="ip-demo-card" style={morphStyle}>
                <div className="ip-demo-head">
                  <span className="ip-demo-kicker">Invite your team</span>
                  <span className="ip-demo-pulse">
                    <i /> On track
                  </span>
                </div>
                <p className="ip-demo-title">Refine your workspace together.</p>
                <p className="ip-demo-copy">
                  Pending invitations are shown apart from active teammates, so you always know who
                  can edit.
                </p>
                <div className="ip-demo-row">
                  <span className="ip-avatar">AM</span>
                  <span className="ip-avatar">JL</span>
                  <span className="ip-avatar">RK</span>
                  <button type="button">Send invite</button>
                </div>
              </div>
              <div className="ip-findings">
                <span>
                  <b>1</b> Title and button compete for attention.
                </span>
                <span>
                  <b>2</b> Extra details distract from inviting your team.
                </span>
                <span>
                  <b>3</b> Pending invitations look like active teammates.
                </span>
              </div>
              <div className="ip-follow">
                <span>Try next</span>
                <code>layout</code>
                <code>polish</code>
              </div>
            </div>
            <div className="ip-command-list">
              <p className="ip-micro">Choose a command</p>
              <div className="ip-command-slider">
                <input
                  id={commandId}
                  type="range"
                  min="0"
                  max="100"
                  value={morph}
                  onChange={(e) => setMorph(Number(e.target.value))}
                  aria-label="Compare a design before and after a command"
                />
                <span>Drag to compare</span>
              </div>
              <div className="ip-command-cats">
                {COMMANDS.map((cat) => (
                  <div className="ip-command-cat" key={cat.group}>
                    <h3>
                      <CommandIcon name={cat.group} /> {cat.group}
                    </h3>
                    <ul>
                      {cat.items.map((item, i) => (
                        <li key={`${item}-${i}`}>
                          <code>/{item}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ip-section ip-action" id="ip-gallery" aria-labelledby="ip-action-title">
          <div className="ip-section-head">
            <h2 id="ip-action-title">Impeccable in action</h2>
            <p>Agent thread and in-app browser, side by side.</p>
          </div>
          <div className="ip-action-grid">
            <div className="ip-thread">
              <div className="ip-window-bar">
                <span />
                <span />
                <span />
                <small>Agent thread</small>
              </div>
              <div className="ip-thread-body">
                <div className="ip-msg ip-msg--you">
                  <b>You</b>
                  <p>
                    <code>/impeccable polish</code> the pricing page. Keep our sharp corners and
                    sober palette. Remove the AI tells.
                  </p>
                </div>
                <div className="ip-msg ip-msg--agent">
                  <b>Agent</b>
                  <p>
                    I’ll polish the page within its existing design system, then run the detector
                    before I hand it back.
                  </p>
                  <ul>
                    <li>
                      <Check size={13} weight="bold" aria-hidden="true" /> DESIGN.md loaded ·
                      existing system preserved
                    </li>
                    <li>
                      <Check size={13} weight="bold" aria-hidden="true" /> 4 tells found · AI beige,
                      italic serif, side-tab, pulsing dot
                    </li>
                    <li>
                      <Check size={13} weight="bold" aria-hidden="true" /> Written to source · 0
                      detector findings
                    </li>
                  </ul>
                </div>
                <div className="ip-msg ip-msg--you">
                  <b>You</b>
                  <p>
                    <code>/impeccable live</code>
                  </p>
                </div>
                <div className="ip-msg ip-msg--agent">
                  <b>Agent</b>
                  <p>
                    Starting Live Mode against the running app. I’ll open the page, then wait for
                    element picks and page-level steering.
                  </p>
                  <ul>
                    <li>
                      <Check size={13} weight="bold" aria-hidden="true" /> Live helper started ·
                      picker injected
                    </li>
                    <li>
                      <Check size={13} weight="bold" aria-hidden="true" /> localhost:3000 opened ·
                      source connected
                    </li>
                  </ul>
                </div>
              </div>
              <div className="ip-thread-input">
                <code>/impeccable</code>
                <span>Choose a command</span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </div>
            </div>
            <div className="ip-browser">
              <div className="ip-window-bar">
                <span />
                <span />
                <span />
                <small>localhost:3000</small>
              </div>
              <div className="ip-browser-stage">
                <div className="ip-site-preview">
                  <div className="ip-site-nav">
                    <b>NEO MIRAI</b>
                    <span>About · Speakers · Tickets</span>
                  </div>
                  <h3>Designing what comes next.</h3>
                  <p>Two days of sharp thinking about the interfaces we’ll be living in.</p>
                  <div className="ip-site-btns">
                    <span>Get tickets</span>
                    <span>See the programme</span>
                  </div>
                  <div className="ip-site-grid">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <div className="ip-gbar">
                  <span className="ip-gbar-brand">/impeccable</span>
                  <span>/polish</span>
                  <span>/audit</span>
                  <span>/live</span>
                </div>
                <div className="ip-outline" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        <section className="ip-section ip-directions" aria-labelledby="ip-dir-title">
          <div className="ip-section-head">
            <h2 id="ip-dir-title">Give your design a different starting point.</h2>
            <p>Explore human-reviewed design directions, each with its own visual rules.</p>
          </div>
          <div className="ip-direction-grid">
            <div className="ip-direction-copy">
              <span className="ip-step">01 · Explore directions</span>
              <p>
                Impeccable weighs these against ideas drawn from your product, then builds around
                the strongest fit.
              </p>
              <span className="ip-step">02 · See one built</span>
              <p>One design direction, carried through a complete website.</p>
              <a href="#ip-gallery">
                Explore the result <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
            <div className="ip-direction-card">
              <div className="ip-direction-art" aria-hidden="true">
                <span>NEO MIRAI</span>
                <div className="ip-direction-orb" />
                <b>
                  Designing what
                  <br />
                  comes next.
                </b>
                <small>12—13 JUNE · TOKYO</small>
              </div>
              <div className="ip-direction-meta">
                <strong>Neo Mirai</strong>
                <span>One design direction, carried through a complete website.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="ip-section ip-built" id="ip-docs" aria-labelledby="ip-built-title">
          <div className="ip-section-head">
            <h2 id="ip-built-title">Built around your project.</h2>
            <p>Your existing colors, components and rules come first.</p>
          </div>
          <div className="ip-built-grid">
            <article className="ip-feature">
              <h3>Respects your design system.</h3>
              <div className="ip-terminal">
                <div className="ip-window-bar">
                  <span />
                  <span />
                  <span />
                  <small>impeccable · scanning codebase</small>
                </div>
                <pre>{`› Walking src/…
✓ src/styles/tokens.css   14 colors, 6 font sizes
✓ tailwind.config.ts      theme.extend merged
✓ src/components/         34 components
    · Button: primary, secondary, ghost
    · Card: 3 variants, 8px / 16px radii
✓ DESIGN.md               brand rules loaded

→ Using your existing design rules.`}</pre>
              </div>
            </article>
            <article className="ip-feature">
              <h3>Keep your design decisions.</h3>
              <p>
                Tell it what matters to your users once. Impeccable saves that context in PRODUCT.md
                and reads it before design work.
              </p>
              <div className="ip-file">
                <div className="ip-file-head">
                  <span>PRODUCT.md</span>
                  <code>Markdown</code>
                </div>
                <div className="ip-file-body">
                  <b>People who plan routes on a phone,</b>
                  <span>with intermittent signal and limited data.</span>
                  <span>They need the day to survive a dead battery.</span>
                </div>
              </div>
            </article>
            <article className="ip-feature">
              <h3>Catch slop as your agent works.</h3>
              <p>
                The design hook checks UI edits and sends findings back to your agent. It runs in
                code, without an AI model or API key.
              </p>
              <ol className="ip-steps-list">
                <li>
                  <b>Agent edits the page</b>
                  <code>Hero.tsx</code>
                </li>
                <li>
                  <b>Detector reports issues</b>
                  <span>AI beige · Clipped label</span>
                </li>
                <li>
                  <b>Agent fixes them</b>
                  <code>Hero.tsx</code>
                </li>
                <li>
                  <b>No issues detected</b>
                  <span>0 findings</span>
                </li>
              </ol>
            </article>
            <article className="ip-feature ip-feature--jobs">
              <h3>Design for the job at hand.</h3>
              <div className="ip-jobs">
                {["Persuade", "Operate", "Read", "Experience"].map((j) => (
                  <span key={j}>{j}</span>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section
          className="ip-section ip-install"
          id="ip-install"
          aria-labelledby="ip-install-title"
        >
          <div className="ip-install-grid">
            <div>
              <h2 id="ip-install-title">Install Impeccable</h2>
              <p className="ip-lead">
                Install the skill, switch on automatic design checks, and make something you’re
                proud of.
              </p>
              <ol className="ip-install-steps">
                <li>
                  <b>1</b>
                  <span>Install Impeccable</span>
                </li>
                <li>
                  <b>2</b>
                  <span>Initialize &amp; enable hooks</span>
                </li>
                <li>
                  <b>3</b>
                  <span>Stay in the loop</span>
                </li>
              </ol>
            </div>
            <div className="ip-install-panel">
              <span className="ip-micro">Install via</span>
              <div className="ip-install-tabs">
                <button type="button" className="is-active">
                  CLI
                </button>
                <button type="button">Codex</button>
                <button type="button">Claude plugin</button>
                <button type="button">skills.sh</button>
              </div>
              <p>Run in your project folder, then follow the prompts.</p>
              <div className="ip-code">
                <code>npx impeccable install</code>
                <button type="button" onClick={copyInstall} aria-label="Copy install command">
                  {copied ? (
                    <Check size={15} weight="bold" aria-hidden="true" />
                  ) : (
                    <Copy size={15} aria-hidden="true" />
                  )}
                </button>
              </div>
              <span className="ip-code-note" role="status">
                {copied ? "Copied to clipboard" : "Tool support & updates"}
              </span>
              <div className="ip-follow-list">
                <div>
                  <span className="ip-follow-icon ip-follow-icon--dark">
                    <Browser size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <b>Chrome extension</b>
                    <p>
                      Find design issues on a page in Chrome. Open the Impeccable panel in DevTools.
                    </p>
                  </div>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </div>
                <div>
                  <span className="ip-follow-icon">
                    <CaretDown size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <b>Automated checks</b>
                    <p>
                      Check UI changes in pull requests. The CLI returns findings and exit codes
                      your build can act on.
                    </p>
                  </div>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="ip-footer">
        <div className="ip-footer-top">
          <div className="ip-footer-brand">
            <b>Impeccable</b>
            <span>The missing design vocabulary for agents.</span>
          </div>
          <nav aria-label="Footer">
            <a href="#ip-gallery">Gallery</a>
            <a href="#ip-docs">Changelog</a>
            <a href="#ip-install">FAQ</a>
            <a href="#ip-top">Privacy</a>
            <a href="#ip-docs">Trust Center</a>
            <a href="https://github.com/pbakaus/impeccable" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </nav>
          <div className="ip-footer-meta">
            <span>Created by Paul Bakaus</span>
            <span>© 2026 Impeccable</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
