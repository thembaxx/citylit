import type { ReactNode } from "react";

export interface MdxStepItem {
  title: string;
  description: ReactNode;
}

export interface MdxStepsProps {
  items: readonly MdxStepItem[];
  className?: string;
}

/**
 * Numbered markdown-compatible steps list with structural hairlines.
 */
export function MdxSteps({ items, className = "" }: MdxStepsProps) {
  return (
    <ol className={`mdxcn-steps ${className}`.trim()}>
      {items.map((item, index) => (
        <li key={item.title} className="mdxcn-step">
          <span className="mdxcn-step-index" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="mdxcn-step-content">
            <strong className="mdxcn-step-title">{item.title}</strong>
            <div className="mdxcn-step-desc">{item.description}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
