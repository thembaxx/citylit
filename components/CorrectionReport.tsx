"use client";

import { useState } from "react";
import { ArrowUpRight, Copy } from "@phosphor-icons/react";
import { correctionReport } from "../lib/corrections";
import type { Correction } from "../lib/client-data";

export default function CorrectionReport({ draft }: { draft: Correction }) {
  const [message, setMessage] = useState("");
  const report = correctionReport(draft);
  if (!report) return null;
  return (
    <div className="correction-handoff">
      <p>
        Send this to the project’s public review queue. GitHub sign-in is required; review the
        report there and choose Submit. Include public venue information only.
      </p>
      {report.needsPaste && <p>Copy this longer report and paste it into the GitHub form.</p>}
      <div className="correction-actions">
        <a href={report.url} target="_blank" rel="noreferrer">
          Open report on GitHub <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(report.text);
              setMessage("Report copied. Paste it into the public review form.");
            } catch {
              setMessage("Copy is unavailable. Open the GitHub form or export your drafts.");
            }
          }}
        >
          <Copy size={16} aria-hidden="true" /> Copy report
        </button>
      </div>
      <p className="planning-note">
        Opening the form does not submit the report or change the catalog.
      </p>
      <p role="status">{message}</p>
    </div>
  );
}
