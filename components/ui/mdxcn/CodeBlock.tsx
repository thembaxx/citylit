"use client";

import { useState } from "react";
import { Check, Copy, FileText } from "@phosphor-icons/react";

export interface MdxCodeBlockProps {
  title?: string;
  language?: string;
  code: string;
  className?: string;
}

/**
 * Copyable markdown/code snippet frame for plain-text references and portable field notes.
 */
export function MdxCodeBlock({
  title,
  language = "markdown",
  code,
  className = "",
}: MdxCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be blocked outside secure contexts
    }
  };

  return (
    <div className={`mdxcn-codeblock ${className}`.trim()}>
      <div className="mdxcn-codeblock-bar">
        <span className="mdxcn-codeblock-meta">
          <FileText size={14} weight="duotone" aria-hidden="true" />
          <span>{title ?? language}</span>
        </span>
        <button
          type="button"
          className="mdxcn-codeblock-copy"
          onClick={handleCopy}
          aria-label={copied ? "Copied markdown snippet" : `Copy ${title ?? language}`}
        >
          {copied ? (
            <>
              <Check size={14} weight="bold" aria-hidden="true" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} weight="regular" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="mdxcn-codeblock-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
