import type { ReactNode } from "react";

export interface MdxTableProps {
  caption?: string;
  headers: readonly string[];
  rows: ReadonlyArray<ReadonlyArray<ReactNode>>;
  className?: string;
}

/**
 * Responsive markdown-structured table with horizontal scroll protection on 320px viewports.
 */
export function MdxTable({ caption, headers, rows, className = "" }: MdxTableProps) {
  return (
    <div className={`mdxcn-table-wrap ${className}`.trim()} tabIndex={0}>
      <table className="mdxcn-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
