"use client";

import { useState } from "react";
import { visitBudget } from "../lib/visit-budget-figure";
import styles from "./VisitBudgetFigure.module.css";

const INITIAL = { stops: 2, minutes: 45, travel: 20, budget: 240 };

export function VisitBudgetFigure() {
  const [prediction, setPrediction] = useState<"less" | "more" | null>(null);
  const [stops, setStops] = useState(INITIAL.stops);
  const [minutes, setMinutes] = useState(INITIAL.minutes);
  const [travel, setTravel] = useState(INITIAL.travel);
  const [budget, setBudget] = useState(INITIAL.budget);
  const [reveal, setReveal] = useState(false);
  const [transfer, setTransfer] = useState<"less" | "more" | null>(null);
  const result = visitBudget(stops, minutes, travel, budget);
  const total = Math.max(result.usedMinutes, budget);
  const percent = (value: number) => String((value / total) * 100) + "%";
  const reset = () => {
    setPrediction(null);
    setStops(INITIAL.stops);
    setMinutes(INITIAL.minutes);
    setTravel(INITIAL.travel);
    setBudget(INITIAL.budget);
    setReveal(false);
    setTransfer(null);
  };

  return (
    <details className={styles.figure}>
      <summary className={styles.summary}>Explore the time budget</summary>
      <div className={styles.body}>
        <section aria-label="Predict" className={styles.block}>
          <p className={styles.step}>1 · Predict</p>
          <h3>With a fixed day, what happens to free time when you add a stop?</h3>
          <div className={styles.choices} role="group" aria-label="Predict time remaining">
            {(["less", "more"] as const).map((answer) => (
              <button key={answer} type="button" aria-pressed={prediction === answer}
                disabled={prediction !== null} onClick={() => setPrediction(answer)}
                className={styles.choice}>{answer === "less" ? "Less free time" : "More free time"}</button>
            ))}
          </div>
        </section>
        {prediction !== null && (
          <>
            <section aria-label="Try" className={styles.block}>
              <p className={styles.step}>2 · Try</p>
              <div className={styles.controls}>
                <label>Stops <output>{stops}</output>
                  <input type="range" min="1" max="4" step="1" value={stops} onChange={(event) => { setStops(Number(event.target.value)); setReveal(false); setTransfer(null); }} />
                </label>
                <label>Visit minutes per stop <output>{minutes} min</output>
                  <input type="range" min="20" max="120" step="5" value={minutes} onChange={(event) => { setMinutes(Number(event.target.value)); setReveal(false); setTransfer(null); }} />
                </label>
                <label>Minutes between stops <output>{travel} min</output>
                  <input type="range" min="0" max="60" step="5" value={travel} onChange={(event) => { setTravel(Number(event.target.value)); setReveal(false); setTransfer(null); }} />
                </label>
                <label>Time available
                  <select value={budget} onChange={(event) => { setBudget(Number(event.target.value)); setReveal(false); setTransfer(null); }}>
                    <option value={240}>4 hours</option>
                    <option value={360}>6 hours</option>
                  </select>
                </label>
              </div>
              <div className={styles.chart} role="img" aria-label={String(result.visitMinutes) + " minutes at stops, " + String(result.travelMinutes) + " minutes between stops, " + String(result.remainingMinutes) + " minutes remaining, " + String(result.overMinutes) + " minutes over the budget"}>
                <span className={styles.visits} style={{ width: percent(result.visitMinutes) }} />
                <span className={styles.travel} style={{ width: percent(result.travelMinutes) }} />
                <span className={styles.remaining} style={{ width: percent(result.remainingMinutes) }} />
              </div>
              <div className={styles.legend}>
                <span><i className={styles.visitSwatch} /> Visits: {result.visitMinutes}m</span>
                <span><i className={styles.travelSwatch} /> Between: {result.travelMinutes}m</span>
                <strong>{result.overMinutes ? String(result.overMinutes) + "m over" : String(result.remainingMinutes) + "m free"}</strong>
              </div>
              <p className={styles.note}>Illustrative times only; not real travel durations, bookings or confirmed opening hours. Your saved day and route estimates are unchanged.</p>
              <button type="button" className={styles.action} disabled={stops === INITIAL.stops} onClick={() => setReveal(true)}>Explain the result</button>
            </section>
            {reveal && (
              <section aria-label="Explain" className={styles.block}>
                <p className={styles.step}>3 · Explain</p>
                <p role="status">{prediction === "less" ? "Your prediction matched." : "Your prediction differed."}</p>
                <p>Each stop costs visit time. Each additional stop also adds a leg between stops. Free time = day budget − all visit minutes − all travel minutes (minimum zero). Going over budget does not mean the venues are open.</p>
                <h3>If travel per leg increases while everything else stays fixed, what happens to free time?</h3>
                <div role="group" aria-label="Apply the time budget" className={styles.choices}>
                  {(["less", "more"] as const).map((answer) => (
                    <button type="button" key={answer} aria-pressed={transfer === answer} disabled={transfer !== null}
                      onClick={() => setTransfer(answer)} className={styles.choice}>{answer === "less" ? "Decreases" : "Increases"}</button>
                  ))}
                </div>
                {transfer && <p role="status">{transfer === "less" ? "Correct: extra travel uses more of the same day." : "Review the time-budget formula and try again."}</p>}
                <button type="button" onClick={reset} className={styles.action}>Reset experiment</button>
              </section>
            )}
          </>
        )}
      </div>
    </details>
  );
}
