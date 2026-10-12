"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Check,
  Plus,
  ShareNetwork,
  Flag,
  ArrowUpRight,
  CaretDown,
  Path,
} from "@phosphor-icons/react";
import { type Place, places } from "../lib/data";
import { normalizeCorrections, readCorrections, publicHttpsUrl } from "../lib/client-data";
import { useDiscovery } from "./useDiscovery";
export default function PlaceActions({ place }: { place: Place }) {
  const { state, update } = useDiscovery();
  const [form, setForm] = useState(false),
    [message, setMessage] = useState("");
  const reduced = useReducedMotion();
  const visited = state.visited.includes(place.id);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: place.name, url: location.href });
      else await navigator.clipboard.writeText(location.href);
      setMessage("Discovery shared.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage(location.href);
    }
  };
  const factLabel: Record<string, string> = {
    admission: "Entry",
    entryPriceZAR: "Standard adult entry (ZAR)",
    price: "Ticket rates",
    openingHours: "Opening hours",
    accessNotes: "Access notes",
    paymentMethods: "Payment methods",
    booking: "Booking",
    stepFreeEntrance: "Step-free entrance",
    accessibleToilets: "Accessible toilets",
    parking: "Parking",
    publicTransport: "Public transport",
    family: "Family suitability",
    environment: "Setting",
    durationMinutes: "Visit duration",
  };
  const factText = (key: string, value: string | number | boolean | null) =>
    value === null
      ? "Not confirmed"
      : typeof value === "boolean"
        ? value
          ? "Confirmed available"
          : "Confirmed unavailable"
        : `${value}${key === "durationMinutes" ? " minutes" : ""}`;
  const previewKey = ["openingHours", "admission", "durationMinutes", "publicTransport"].find(
    (key) => place.facts?.[key]?.value != null,
  );
  const preview = previewKey
    ? `${factLabel[previewKey]} · ${factText(previewKey, place.facts![previewKey].value)}`
    : "Hours, access, and what to bring";
  return (
    <section className="place-planning" aria-label="Plan this discovery">
      {place.visitNote && <p className="visit-note">{place.visitNote}</p>}
      <div className="day-actions">
        <button
          onClick={() => {
            const first = places.find((p) => p.id === state.itinerary[0]);
            if (first && first.city !== place.city) {
              setMessage("Your day belongs to another destination. Clear it in Build a day first.");
              return;
            }
            update({ itinerary: Array.from(new Set([...state.itinerary, place.id])) });
            setMessage("Added to your day.");
          }}
        >
          <Plus size={16} />
          Add to day
        </button>
        <button
          aria-pressed={visited}
          onClick={() => {
            update({
              visited: visited
                ? state.visited.filter((id) => id !== place.id)
                : [...state.visited, place.id],
            });
            setMessage(visited ? "Visit removed." : "A chapter visited.");
          }}
        >
          <Check size={16} />
          {visited ? "Visited" : "Mark visited"}
        </button>
        <button onClick={share}>
          <ShareNetwork size={16} weight="bold" />
          Share
        </button>
      </div>
      <p role="status">{message}</p>
      {visited && state.passport && (
        <motion.div
          className="visit-stamp"
          initial={{ scale: reduced ? 1 : 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <Check size={18} />
          Passport stamped · {place.name}
        </motion.div>
      )}
      <details className="practical-details visit-plan">
        <summary>
          <span className="visit-plan-mark" aria-hidden="true">
            <Path size={18} weight="bold" />
          </span>
          <span>
            <strong>Plan your visit</strong>
            <small>{preview}</small>
          </span>
          <CaretDown className="visit-plan-caret" size={16} weight="bold" aria-hidden="true" />
        </summary>
        <dl>
          {Object.entries(place.facts || {}).map(([key, fact]) => (
            <div key={key}>
              <dt>{factLabel[key] || key}</dt>
              <dd>
                {factText(key, fact.value)}
                {fact.value !== null && (
                  <small>
                    {fact.confidence === "editorial-estimate" ? "Editorial estimate" : "Verified"} ·{" "}
                    {fact.checkedAt}
                    {fact.source.startsWith("https:") && (
                      <a href={fact.source} target="_blank" rel="noreferrer">
                        Source <ArrowUpRight size={12} />
                      </a>
                    )}
                  </small>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <p className="planning-note">
          A venue pin identifies the site; an entrance pin is shown only when the entrance itself is
          verified. Confirm availability before travelling.
        </p>
      </details>
      <button className="correction-toggle" onClick={() => setForm(!form)} aria-expanded={form}>
        <Flag size={14} />
        Suggest a correction
      </button>
      {form && (
        <form
          className="correction-form"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const source = String(data.get("source"));
            if (!publicHttpsUrl(source)) {
              setMessage("Use a public https source link without embedded credentials.");
              return;
            }
            try {
              const queue = readCorrections();
              if (queue.length >= 100) {
                setMessage("Your review queue is full. Export it before adding more drafts.");
                return;
              }
              queue.push({
                id: crypto.randomUUID(),
                placeId: place.id,
                field: String(data.get("field") || ""),
                value: String(data.get("value") || ""),
                source,
                createdAt: new Date().toISOString(),
                status: "needs-review",
              });
              localStorage.setItem(
                "citylit-corrections",
                JSON.stringify(normalizeCorrections(queue)),
              );
              setMessage(
                "Draft saved on this device for review. It has not changed the public listing.",
              );
              setForm(false);
            } catch {
              setMessage("This browser could not save the draft.");
            }
          }}
        >
          <label>
            What needs updating?
            <select name="field">
              <option value="address">Address / entrance</option>
              <option value="accessibility">Accessibility</option>
              <option value="hours">Opening hours</option>
              <option value="pricing">Pricing / payment</option>
              <option value="photos">Photos</option>
              <option value="other">Other information</option>
            </select>
          </label>
          <label>
            Suggested details
            <textarea name="value" required maxLength={1200} />
          </label>
          <label>
            Supporting source
            <input type="url" name="source" required maxLength={2048} placeholder="https://" />
          </label>
          <p className="planning-note">
            Drafts stay on your device. Review and export them from the data quality page before
            publishing.
          </p>
          <button className="pill-button" type="submit">
            Save for review
          </button>
        </form>
      )}
    </section>
  );
}
