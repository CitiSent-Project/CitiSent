import { motion } from 'framer-motion'
import { ProfilePill } from './ProfilePill'
import { TableLoader } from '../ui/TableLoader'

const MotionDiv = motion.div

export function DashboardTableCard({ title, columns, rows, isLoading = false }) {
  const shouldShowLoader = isLoading && rows.length > 0

  return (
    <MotionDiv
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="border-b border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <TableLoader
            isLoading={shouldShowLoader}
            delayMs={0}
            variant="refreshing"
            label="Refreshing table..."
            refreshText="Refreshing..."
            rows={1}
            columns={columns.length}
            cellClassName="h-4 w-24"
          />
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-100 transition hover:bg-slate-50">
                {Object.values(row).map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={`px-6 py-4 text-sm text-slate-700 ${
                      cellIdx !== 0 && /\d/.test(String(cell)) ? 'font-numeric' : ''
                    }`}
                  >
                    {cellIdx === 0 ? <ProfilePill label={cell} /> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MotionDiv>
  )
}
