"use client";
import { useEffect, useRef, useState } from "react";
import { ClockIcon, MapTrifoldIcon } from "@phosphor-icons/react";
import type { Place } from "../lib/data";
import {
  assessItinerary,
  clearFeasibility,
  emptyOpening,
  feasibilityPlanKey,
  formatPlanTime,
  legKey,
  loadFeasibility,
  saveFeasibility,
  visitMinutes,
  type FeasibilitySettings,
  type OpeningEvidence,
  type TravelEstimate,
} from "../lib/itinerary-feasibility";

const deviceStorage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
};
const inputStyle = {
  width: "100%",
  minHeight: 44,
  padding: 10,
  border: "1px solid var(--line)",
  borderRadius: 12,
  background: "var(--surface)",
  color: "var(--ink)",
};
export function ItineraryFeasibility({
  places,
  onRequestTravel,
}: {
  places: Place[];
  onRequestTravel?: (coords: number[][]) => Promise<TravelEstimate>;
}) {
  const key = feasibilityPlanKey(places);
  const orderKey = places.map((place) => place.id).join("|");
  const [loaded, setLoaded] = useState<{ key: string; settings: FeasibilitySettings } | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const writable = useRef(false);
  const requestId = useRef(0);
  const latest = useRef<{ key: string; settings: FeasibilitySettings } | null>(null);
  useEffect(() => {
    writable.current = false;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      const saved = loadFeasibility(deviceStorage, key);
      latest.current = { key, settings: saved.settings };
      setLoaded({ key, settings: saved.settings });
      setError(saved.error);
      setStatus("");
      writable.current = !saved.error;
    });
    return () => {
      cancelled = true;
    };
  }, [key]);
  useEffect(() => {
    void Promise.resolve().then(() => setBusy(false));
    return () => {
      requestId.current += 1;
    };
  }, [orderKey]);
  if (!places.length) return null;
  if (places.length > 30) return <p role="alert">Check up to thirty stops in one day.</p>;
  if (!loaded || loaded.key !== key) return <output>Opening your planning settings…</output>;
  const settings = loaded.settings;
  const assessment = assessItinerary(places, settings);
  const update = (next: FeasibilitySettings) => {
    latest.current = { key, settings: next };
    setLoaded({ key, settings: next });
    if (!writable.current) {
      setStatus("Changes are only in this open screen because saved data is unavailable.");
      return;
    }
    const message = saveFeasibility(deviceStorage, key, next);
    setError(message);
    setStatus(
      message ? "Changes are only in this open screen." : "Planning settings saved on this device.",
    );
  };
  const opening = (id: string, change: Partial<OpeningEvidence>) =>
    update({
      ...settings,
      openings: {
        ...settings.openings,
        [id]: { ...(settings.openings[id] ?? emptyOpening(settings.date)), ...change },
      },
    });
  const requestTravel = async () => {
    if (!onRequestTravel) return;
    const request = ++requestId.current;
    setBusy(true);
    setStatus("Requesting route estimates…");
    try {
      const estimate = await onRequestTravel(places.map((place) => place.coords));
      if (request !== requestId.current) return;
      if (
        estimate.minutes.length !== places.length - 1 ||
        !estimate.minutes.every((value) => Number.isFinite(value) && value >= 0 && value <= 1440) ||
        !estimate.source.trim() ||
        !Number.isFinite(Date.parse(estimate.checkedAt))
      )
        throw new Error("The route provider returned incomplete estimates.");
      const current = latest.current;
      if (!current || current.key !== key) return;
      const travel = { ...current.settings.travel };
      estimate.minutes.forEach((minutes, index) => {
        const edge = legKey(places[index].id, places[index + 1].id);
        if (JSON.stringify(current.settings.travel[edge]) !== JSON.stringify(settings.travel[edge]))
          return;
        travel[edge] = {
          minutes: Math.ceil(minutes),
          source: "route",
          provider: estimate.source.slice(0, 300),
          checkedAt: estimate.checkedAt,
        };
      });
      update({ ...current.settings, travel });
      setStatus("Route estimates added. Travel conditions may change; review each leg.");
    } catch (cause) {
      if (request === requestId.current)
        setStatus(
          cause instanceof Error
            ? cause.message
            : "Routes are unavailable. Enter travel times manually.",
        );
    } finally {
      if (request === requestId.current) setBusy(false);
    }
  };
  return (
    <section className="adventure-section" aria-label="Itinerary feasibility">
      <h3>
        <ClockIcon size={22} aria-hidden="true" /> Will your day fit?
      </h3>
      <p className="planning-note">
        Start at the first venue. Travel to that venue is excluded. All plan times use South African
        time (SAST). Opening hours are entered from sources you check; Citylit does not infer them.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        <label>
          Visit date
          <input
            type="date"
            value={settings.date}
            onChange={(event) => update({ ...settings, date: event.target.value })}
            style={inputStyle}
          />
        </label>
        <label>
          Start at first stop
          <input
            type="time"
            value={settings.start}
            onChange={(event) => update({ ...settings, start: event.target.value })}
            style={inputStyle}
          />
        </label>
        <label>
          Time budget (minutes)
          <input
            type="number"
            min={1}
            max={1440}
            value={settings.budgetMinutes || ""}
            onChange={(event) => update({ ...settings, budgetMinutes: Number(event.target.value) })}
            style={inputStyle}
          />
        </label>
      </div>
      {onRequestTravel && (
        <div>
          <button
            type="button"
            className="atlas-button"
            disabled={
              busy ||
              places.length < 2 ||
              places.some((place) => place.coordinateAccuracy !== "venue")
            }
            onClick={() => {
              void requestTravel();
            }}
          >
            <MapTrifoldIcon size={18} aria-hidden="true" />
            {busy ? "Requesting estimates…" : "Get route travel estimates"}
          </button>
          {places.some((place) => place.coordinateAccuracy !== "venue") && (
            <p className="planning-note">
              Routing needs exact venue pins for every stop. Enter and verify travel times manually
              for approximate pins.
            </p>
          )}
        </div>
      )}
      <ol style={{ display: "grid", gap: 16, paddingInlineStart: 24 }}>
        {assessment.rows.map((row, index) => {
          const hours = settings.openings[row.place.id] ?? emptyOpening(settings.date);
          return (
            <li key={row.place.id} className="correction-review">
              <h4>{row.place.name}</h4>
              <p>
                <strong>{formatPlanTime(row.arrival)}</strong> → {formatPlanTime(row.departure)}
              </p>
              {index > 0 && (
                <label>
                  Travel from {places[index - 1].name} (minutes)
                  <input
                    type="number"
                    min={0}
                    max={1440}
                    value={row.leg?.minutes ?? ""}
                    placeholder="Not established"
                    style={inputStyle}
                    onChange={(event) =>
                      update({
                        ...settings,
                        travel: {
                          ...settings.travel,
                          [legKey(places[index - 1].id, row.place.id)]: {
                            minutes: event.target.value === "" ? null : Number(event.target.value),
                            source: "manual",
                            provider: "Your travel estimate",
                            checkedAt: new Date().toISOString(),
                          },
                        },
                      })
                    }
                  />
                  <span className="planning-note">
                    {row.leg?.source === "route"
                      ? `Route estimate: ${row.leg.provider} · ${row.leg.checkedAt}`
                      : "User estimate; no routing or live traffic is implied."}
                  </span>
                </label>
              )}
              <label>
                Visit duration (minutes)
                <input
                  type="number"
                  min={0}
                  max={1440}
                  value={visitMinutes(row.place, settings) ?? ""}
                  placeholder="Choose a duration"
                  style={inputStyle}
                  onChange={(event) =>
                    update({
                      ...settings,
                      visits: {
                        ...settings.visits,
                        [row.place.id]:
                          event.target.value === "" ? null : Number(event.target.value),
                      },
                    })
                  }
                />
                <span className="planning-note">
                  {Object.hasOwn(settings.visits, row.place.id)
                    ? "Your planning estimate."
                    : "Catalogue duration when available; review this estimate."}
                </span>
              </label>
              <details style={{ marginTop: 12 }}>
                <summary>Opening evidence for {row.place.name}</summary>
                <label>
                  Opening status
                  <select
                    value={hours.status}
                    style={inputStyle}
                    onChange={(event) =>
                      opening(row.place.id, {
                        status: event.target.value as OpeningEvidence["status"],
                        appliesOn: settings.date,
                      })
                    }
                  >
                    <option value="unknown">Unknown</option>
                    <option value="open">Known intervals entered below</option>
                    <option value="closed">Closed on this date</option>
                  </select>
                </label>
                {hours.status !== "unknown" && (
                  <>
                    {hours.status === "open" && (
                      <label>
                        Opening intervals
                        <input
                          value={hours.intervals}
                          maxLength={150}
                          placeholder="09:00-12:00, 13:00-17:00"
                          style={inputStyle}
                          onChange={(event) =>
                            opening(row.place.id, { intervals: event.target.value })
                          }
                        />
                      </label>
                    )}
                    <label>
                      Source URL or booking/reference note
                      <input
                        value={hours.source}
                        maxLength={1000}
                        style={inputStyle}
                        onChange={(event) => opening(row.place.id, { source: event.target.value })}
                      />
                    </label>
                    <label>
                      Date you checked the source
                      <input
                        type="date"
                        value={hours.checkedAt}
                        style={inputStyle}
                        onChange={(event) =>
                          opening(row.place.id, { checkedAt: event.target.value })
                        }
                      />
                    </label>
                    <p className="planning-note">
                      Evidence applies to {hours.appliesOn || "a date not yet selected"}.{" "}
                      {hours.appliesOn !== settings.date && (
                        <button
                          type="button"
                          className="atlas-button"
                          onClick={() => opening(row.place.id, { appliesOn: settings.date })}
                        >
                          I rechecked these hours for {settings.date}
                        </button>
                      )}
                    </p>
                    <p className="planning-note">
                      Use comma-separated intervals. An end earlier than its start means closing
                      after midnight. Information is entered by you and has not been independently
                      verified by Citylit.
                    </p>
                  </>
                )}
              </details>
              {row.warnings.length > 0 && (
                <ul className="planning-note">
                  {row.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
      <div className="correction-review" aria-live="polite">
        <strong>
          {assessment.overBudget
            ? "Over the time budget"
            : assessment.incomplete
              ? "Timing is incomplete"
              : assessment.closed
                ? "Opening times conflict with this plan"
                : "Current timing estimates fit the budget"}
        </strong>
        <p>
          {assessment.incomplete ? "At least " : "Total "}
          {assessment.minimumMinutes} minutes of visits and travel · budget {settings.budgetMinutes}{" "}
          minutes.
        </p>
        {assessment.openingUnresolved && (
          <p className="planning-note">
            Opening evidence is incomplete. This plan is not confirmed feasible until those details
            are checked.
          </p>
        )}
        <p className="planning-note">
          No booking, availability or transport reservation is created.
        </p>
      </div>
      {error && <p role="alert">{error}</p>}
      <output className="planning-note" aria-live="polite">
        {status}
      </output>
      <p className="planning-note">
        Settings for up to eight stop collections stay on this browser. Reordering keeps visit
        evidence; travel times stay attached to the same directed leg.
      </p>
      <button
        type="button"
        className="atlas-button"
        onClick={() => {
          if (
            !window.confirm(
              "Clear saved feasibility settings for these stops? Your itinerary itself will remain.",
            )
          )
            return;
          const message = clearFeasibility(deviceStorage, key);
          setError(message);
          if (!message) {
            writable.current = true;
            setStatus(
              "Saved settings cleared. Current values remain in this screen until you change them or reopen the plan.",
            );
          }
        }}
      >
        Clear saved timing settings
      </button>
    </section>
  );
}
