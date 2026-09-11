import { motion } from 'framer-motion'
import { ProfilePill } from './ProfilePill'
import { TableLoader } from '../ui/TableLoader'

const MotionDiv = motion.div

export function DashboardTableCard({ title, columns, rows, isLoading = false }) {
  const isInitialLoading = isLoading && rows.length === 0;
  const isRefreshing = isLoading && rows.length > 0;

  return (
    <MotionDiv
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-700/80 dark:bg-slate-800"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="border-b border-slate-200 px-4 py-3.5 sm:px-6 sm:py-4 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 text-base sm:text-lg dark:text-white">{title}</h3>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
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
            cellClassName="h-4 w-24"
          />
          <TableLoader
            isLoading={isInitialLoading}
            delayMs={0}
            minDisplayMs={0}
            variant="skeleton"
            label="Loading table..."
            rows={5}
            columns={columns.length}
            cellClassName="h-4 w-24"
          />
          {!isInitialLoading && (
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                  No data available.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-700/60 dark:hover:bg-slate-700/40">
                {Object.values(row).map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={`px-6 py-4 text-sm text-slate-700 dark:text-slate-200 ${
                      cellIdx !== 0 && /\d/.test(String(cell)) ? 'font-numeric' : ''
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
      <div className="block md:hidden bg-slate-50/50 p-3 sm:p-4 dark:bg-slate-900/40">
        {isInitialLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 w-full animate-pulse rounded-xl bg-slate-200/50 dark:bg-slate-700/50" />
            ))}
          </div>
        )}
        {!isInitialLoading && rows.length === 0 && (
          <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-8 text-center shadow-2xs dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">No data available.</p>
          </div>
        )}
        {!isInitialLoading && rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((row, idx) => {
              const cells = Object.values(row)
              const primaryCell = cells[0]
              const secondaryCells = cells.slice(1)

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs transition-all hover:border-slate-300 dark:border-slate-700/80 dark:bg-slate-800 dark:hover:border-slate-600"
                >
                  {/* Card Header: User/Admin Identity */}
                  <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-700/60 min-w-0">
                    <ProfilePill label={primaryCell} />
                  </div>

                  {/* Secondary Metadata Rows */}
                  <div className="mt-2.5 space-y-2">
                    {secondaryCells.map((cell, sIdx) => {
                      const colLabel = columns[sIdx + 1]
                      const isNumeric = /\d/.test(String(cell))

                      return (
                        <div
                          key={sIdx}
                          className="flex items-start justify-between gap-3 text-xs"
                        >
                          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-400">
                            {colLabel}
                          </span>
                          <span
                            className={`min-w-0 flex-1 text-right text-xs sm:text-sm font-medium text-slate-800 break-words dark:text-slate-200 ${
                              isNumeric ? 'font-numeric' : ''
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
