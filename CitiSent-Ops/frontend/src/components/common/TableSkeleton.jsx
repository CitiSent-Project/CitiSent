import React from "react";

/**
 * TableSkeleton Component
 *
 * Renders pulse-animated placeholder skeleton rows for data tables.
 * Prevents layout shift and drastically improves perceived performance.
 *
 * @param {number} [rows=5] - Number of skeleton rows to render
 * @param {number} [columns=5] - Number of columns per row
 */
export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={`skeleton-row-${rIdx}`} className="border-b border-slate-800/40">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={`skeleton-cell-${rIdx}-${cIdx}`} className="px-4 py-4">
              <div className="animate-pulse space-y-2">
                <div
                  className="h-3.5 bg-slate-800/70 rounded-md"
                  style={{
                    // Varies widths naturally between columns to simulate realistic text lengths
                    width:
                      cIdx === 0
                        ? "70%"
                        : cIdx === 1
                          ? "50%"
                          : cIdx === columns - 1
                            ? "40%"
                            : "60%",
                  }}
                />
                {cIdx === 0 && (
                  <div className="h-2.5 bg-slate-800/40 rounded-md w-1/3" />
                )}
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
