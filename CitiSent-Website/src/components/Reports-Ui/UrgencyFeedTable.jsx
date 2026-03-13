import { useState, useRef, useEffect } from 'react'
import { FiMoreVertical, FiEye, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi'
import { notifySuccess } from '../ui/Toasters'

const URGENCY_BADGE = {
  Emergency: 'bg-red-100 text-red-700',
  Urgent: 'bg-orange-100 text-orange-700',
  Moderate: 'bg-yellow-100 text-yellow-700',
  'Low Priority': 'bg-green-100 text-green-700',
  Calm: 'bg-sky-100 text-sky-700',
}

const STATUS_BADGE = {
  Pending: 'bg-amber-100 text-amber-700',
  'Under Review': 'bg-blue-100 text-blue-700',
  Resolved: 'bg-emerald-100 text-emerald-700',
  Unresolved: 'bg-rose-100 text-rose-700',
}

function ActionMenu({ report, onViewReport, onUpdateStatus }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function handleQuickStatus(status) {
    onUpdateStatus?.(report.id, status)
    notifySuccess(`Report ${report.id} set to ${status}.`)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
      >
        <FiMoreVertical className="text-sm" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => { onViewReport?.(report); setOpen(false) }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <FiEye className="text-slate-400" /> View Details
          </button>
          <hr className="my-1 border-slate-100" />
          <button
            type="button"
            onClick={() => handleQuickStatus('Under Review')}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
          >
            <FiClock className="text-blue-400" /> Mark Under Review
          </button>
          <button
            type="button"
            onClick={() => handleQuickStatus('Resolved')}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
          >
            <FiCheckCircle className="text-emerald-400" /> Mark Resolved
          </button>
          <button
            type="button"
            onClick={() => handleQuickStatus('Unresolved')}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
          >
            <FiXCircle className="text-rose-400" /> Mark Unresolved
          </button>
        </div>
      )}
    </div>
  )
}

export function UrgencyFeedTable({ rows = [], onViewReport, onUpdateStatus }) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-slate-400">
        No reports to display.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3 hidden md:table-cell">Location</th>
            <th className="px-4 py-3">Urgency</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 hidden lg:table-cell">Date</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-slate-700">{row.id}</td>
              <td className="px-4 py-3 text-slate-800">{row.name}</td>
              <td className="px-4 py-3 hidden md:table-cell text-slate-600">{row.location}</td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${URGENCY_BADGE[row.urgency] || ''}`}>
                  {row.urgency}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[row.status || 'Pending'] || ''}`}>
                  {row.status || 'Pending'}
                </span>
              </td>
              <td className="px-4 py-3 hidden lg:table-cell text-slate-500">{row.date}</td>
              <td className="px-4 py-3 text-right">
                <ActionMenu
                  report={row}
                  onViewReport={onViewReport}
                  onUpdateStatus={onUpdateStatus}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
