import type { ReactNode } from "react";
import { CheckCircle, Compass, Info, WarningCircle } from "@phosphor-icons/react/dist/ssr";

export type MdxCalloutTone = "note" | "tip" | "warning" | "verified";

const TONE_META: Record<MdxCalloutTone, { label: string; Icon: typeof Info }> = {
  note: { label: "Note", Icon: Info },
  tip: { label: "Field Tip", Icon: Compass },
  warning: { label: "Notice", Icon: WarningCircle },
  verified: { label: "Source Check", Icon: CheckCircle },
};

export interface MdxCalloutProps {
  tone?: MdxCalloutTone;
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Markdown-friendly editorial callout with Phosphor icon indicator and Citylit surface tokens.
 */
export function MdxCallout({ tone = "note", title, children, className = "" }: MdxCalloutProps) {
  const { label, Icon } = TONE_META[tone];
  return (
    <aside
      className={`mdxcn-callout is-${tone} ${className}`.trim()}
      role="note"
      aria-label={title ?? label}
    >
      <div className="mdxcn-callout-header">
        <Icon size={16} weight="duotone" aria-hidden="true" />
        <span>{title ?? label}</span>
      </div>
      <div className="mdxcn-callout-body">{children}</div>
    </aside>
  );
}
