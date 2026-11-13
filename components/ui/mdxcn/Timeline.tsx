import type { ReactNode } from "react";

export interface MdxTimelineEntry {
  date: string;
  title: string;
  detail?: ReactNode;
}

export interface MdxTimelineProps {
  entries: readonly MdxTimelineEntry[];
  className?: string;
}

/**
 * Vertical editorial timeline designed for provenance records and destination chronologies.
 */
export function MdxTimeline({ entries, className = "" }: MdxTimelineProps) {
  return (
    <ol className={`mdxcn-timeline ${className}`.trim()}>
      {entries.map((entry) => (
        <li key={`${entry.date}-${entry.title}`} className="mdxcn-timeline-item">
          <span className="mdxcn-timeline-node" aria-hidden="true" />
          <div className="mdxcn-timeline-meta">{entry.date}</div>
          <div className="mdxcn-timeline-title">{entry.title}</div>
          {entry.detail ? <div className="mdxcn-timeline-detail">{entry.detail}</div> : null}
        </li>
      ))}
    </ol>
  );
}
