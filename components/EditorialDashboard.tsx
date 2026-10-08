"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useDiscovery } from "./useDiscovery";
import { useEffect, useState } from "react";
import { cities, places } from "../lib/data";
import { placePath, activeEvents } from "../lib/adventure";
import ThemeToggle from "./ThemeToggle";
import { qualityIssues } from "../lib/quality";
type Correction = {
  id: string;
  placeId: string;
  field: string;
  value: string;
  source: string;
  createdAt: string;
  status: string;
};
const Atmosphere = dynamic(() => import("./Atmosphere"), { ssr: false });
export default function EditorialDashboard() {
  const { state } = useDiscovery();
  const [night, setNight] = useState(true);
  const [city, setCity] = useState("all"),
    [queue, setQueue] = useState<Correction[]>([]),
    [duplicates, setDuplicates] = useState<string[]>([]);
  useEffect(() => {
    try {
      setQueue(JSON.parse(localStorage.getItem("citylit-corrections") || "[]"));
    } catch {}
    const seen = new Set<string>();
    setDuplicates(
      places
        .filter((p) => {
          const key = p.city + ":" + p.name.toLowerCase().replace(/\W/g, "");
          if (seen.has(key)) return true;
          seen.add(key);
          return false;
        })
        .map((p) => p.name),
    );
  }, []);
  const list = places.filter((p) => city === "all" || p.city === city);
  const update = (id: string, status: string) => {
    const next = queue.map((row) => (row.id === id ? { ...row, status } : row));
    setQueue(next);
    localStorage.setItem("citylit-corrections", JSON.stringify(next));
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob(
        [JSON.stringify({ exportedAt: new Date().toISOString(), corrections: queue }, null, 2)],
        { type: "application/json" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "citylit-reviewed-corrections.json";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="field-guide">
      <Atmosphere mode="editorial" city={0} category={0} night={night} animate={!state.essential} />
      <header className="field-guide-header">
        <ThemeToggle onChange={setNight} />
        <Link href="/explore">← Back to the field guide</Link>
        <Link href="/">Map</Link>
      </header>
      <h1>Care for the catalog.</h1>
      <p className="field-guide-intro">
        See what needs attention before the next chapter is published.
      </p>
      <div className="quality-summary">
        <span>{places.length} places</span>
        <span>{cities.length} destinations</span>
        <span>{places.filter((p) => p.coordinateAccuracy === "venue").length} venue pins</span>
        <span>{activeEvents().length} active event listings</span>
        <span>{duplicates.length} duplicate names</span>
      </div>
      <section className="adventure-section">
        <h2>Correction review</h2>
        <p>
          These drafts belong to this browser. Reviewing them prepares an export; it does not change
          the published catalog.
        </p>
        <button className="pill-button" onClick={download}>
          Export review queue
        </button>
        {queue.map((row) => (
          <article className="correction-review" key={row.id}>
            <h3>{places.find((p) => p.id === row.placeId)?.name || row.placeId}</h3>
            <p>
              {row.field}: {row.value}
            </p>
            <a
              href={/^https?:\/\//.test(row.source) ? row.source : "#"}
              target="_blank"
              rel="noreferrer"
            >
              Supporting source
            </a>
            <p>Status: {row.status}</p>
            <button onClick={() => update(row.id, "reviewed")}>Mark reviewed</button>
            <button onClick={() => update(row.id, "rejected")}>Reject draft</button>
          </article>
        ))}
        {!queue.length && (
          <p>No correction drafts on this device. Suggest one from a place page.</p>
        )}
      </section>
      <section className="adventure-section">
        <h2>Coverage and freshness</h2>
        <label>
          Destination
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="all">All destinations</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <p>
          Address, access and payment facts: recheck every 30 days. Events: check weekly and hide
          automatically after the end date. Stable historical context: review every 180 days.
          Broken-link flags reflect the last crawl, not a live probe.
        </p>
        <div className="quality-list">
          {list.map((p) => (
            <article key={p.id}>
              <Link href={placePath(p)}>
                <h3>{p.name}</h3>
              </Link>
              <p>Last checked {p.checkedAt}</p>
              <ul>
                {qualityIssues(p).map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
