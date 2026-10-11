import { motion } from 'framer-motion'
import { ProfilePill } from './ProfilePill'
import { TableLoader } from '../ui/TableLoader'

const MotionDiv = motion.div

export function DashboardTableCard({ title, columns, rows, isLoading = false }) {
  const isInitialLoading = isLoading && rows.length === 0;
  const isRefreshing = isLoading && rows.length > 0;

  return (
    <MotionDiv
      className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
    >
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 text-sm dark:text-white">{title}</h3>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <TableLoader
            isLoading={isRefreshing}
            delayMs={0}
            variant="refreshing"
            label="Refreshing table..."
            refreshText="Refreshing..."
            rows={1}
            columns={columns.length}
            cellClassName="h-3.5 w-20"
          />
          <TableLoader
            isLoading={isInitialLoading}
            delayMs={0}
            minDisplayMs={0}
            variant="skeleton"
            label="Loading table..."
            rows={5}
            columns={columns.length}
            cellClassName="h-3.5 w-20"
          />
          {!isInitialLoading && (
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No data available.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 transition hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
                    {Object.values(row).map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className={`px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 ${cellIdx !== 0 && /\d/.test(String(cell)) ? 'font-numeric' : ''
                          }`}
                      >
                        {cellIdx === 0 ? <ProfilePill label={cell} /> : cell}
                      </td>
                    ))}
                  </tr>
                )))}
            </tbody>
          )}
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden bg-slate-50/50 p-3 dark:bg-slate-900/40">
        {isInitialLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 w-full animate-shimmer rounded-md bg-slate-200/50 dark:bg-slate-700/50" />
            ))}
          </div>
        )}
        {!isInitialLoading && rows.length === 0 && (
          <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500 dark:text-slate-400">No data available.</p>
          </div>
        )}
        {!isInitialLoading && rows.length > 0 && (
          <div className="space-y-2">
            {rows.map((row, idx) => {
              const cells = Object.values(row)
              const primaryCell = cells[0]
              const secondaryCells = cells.slice(1)

              return (
                <div
                  key={idx}
                  className="rounded-md border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  {/* Card Header: User/Admin Identity */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 min-w-0">
                    <ProfilePill label={primaryCell} />
                  </div>

                  {/* Secondary Metadata Rows */}
                  <div className="mt-2 space-y-1.5">
                    {secondaryCells.map((cell, sIdx) => {
                      const colLabel = columns[sIdx + 1]
                      const isNumeric = /\d/.test(String(cell))

                      return (
                        <div
                          key={sIdx}
                          className="flex items-start justify-between gap-2 text-xs"
                        >
                          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {colLabel}
                          </span>
                          <span
                            className={`min-w-0 flex-1 text-right text-xs font-medium text-slate-700 wrap-break-word dark:text-slate-300 ${isNumeric ? 'font-numeric' : ''
                              }`}
                          >
                            {cell || '—'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </MotionDiv>
  )
}
