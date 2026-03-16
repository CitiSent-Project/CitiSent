import { useState } from 'react'
import { FiChevronRight, FiCheckCircle, FiClock, FiAlertCircle, FiFileText } from 'react-icons/fi'
import { notifySuccess, notifyError } from '../../../components/ui/Toasters'
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_OPTIONS,
  REPORT_URGENCY_BADGE_CLASSES,
  normalizeReportStatus,
} from '../../../models/reportStatusModel'
import {
  createReportTimelineEntry,
  validateReportStatusChange,
} from '../../../controllers/reportStatusController'

const STATUS_ICONS = {
  Pending: FiClock,
  'In Progress': FiFileText,
  Resolved: FiCheckCircle,
  Unresolved: FiAlertCircle,
}

export function ReportDetailPage({ report, onBackToReports, onUpdateStatus }) {
  const [adminNotes, setAdminNotes] = useState('')
  const [timeline, setTimeline] = useState(() => [
    {
      id: 1,
      action: 'Report Submitted',
      status: 'Pending',
      note: 'Report was submitted by the citizen.',
      date: report?.date || 'N/A',
      actor: report?.name || 'Citizen',
    },
  ])

  if (!report) {
    return (
      <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
            <button onClick={onBackToReports} className="hover:text-slate-700 transition-colors">Reports</button>
            <FiChevronRight className="text-xs" />
            <span className="text-slate-700">Report Detail</span>
          </nav>
          <h1 className="text-xl font-semibold text-slate-900">Report not found</h1>
        </div>
      </main>
    )
  }

  const currentStatus = normalizeReportStatus(report.status)
  const StatusIcon = STATUS_ICONS[currentStatus] || FiClock

  function handleStatusChange(newStatus) {
    const validation = validateReportStatusChange({
      currentStatus,
      nextStatus: newStatus,
      adminNotes,
    })

    if (!validation.ok) {
      notifyError(validation.title, validation.message)
      return
    }

    setTimeline((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        ...createReportTimelineEntry({
          nextStatus: validation.nextStatus,
          adminNotes,
        }),
      },
    ])

    onUpdateStatus(report.id, validation.nextStatus)
    notifySuccess(`Report ${report.id} marked as ${validation.nextStatus}.`)
    setAdminNotes('')
  }

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm text-slate-500">
          <button onClick={onBackToReports} className="hover:text-slate-700 transition-colors">
            Reports
          </button>
          <FiChevronRight className="text-xs" />
          <span className="text-slate-700 font-medium">Report Detail</span>
          <FiChevronRight className="text-xs" />
          <span className="text-slate-400 font-numeric">{report.id}</span>
        </nav>

        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Report <span className="font-numeric">{report.id}</span></h1>
            <p className="mt-1 text-sm text-slate-500">Submitted on <span className="font-numeric">{report.date}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${REPORT_STATUS_BADGE_CLASSES[currentStatus]}`}>
              <StatusIcon className="text-sm" />
              {currentStatus}
            </span>
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${REPORT_URGENCY_BADGE_CLASSES[report.urgency] || 'bg-slate-100 text-slate-600'}`}>
              {report.urgency}
            </span>
          </div>
        </header>

        {/* Report Information */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Report Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Report ID</p>
              <p className="mt-0.5 text-slate-900 font-numeric">{report.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Reported By</p>
              <p className="mt-0.5 text-slate-900">{report.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-0.5 text-slate-900">{report.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
              <p className="mt-0.5 text-slate-900">{report.location}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Category / Agency</p>
              <p className="mt-0.5 text-slate-900">{report.category}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Source</p>
              <p className="mt-0.5 text-slate-900">{report.source}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Message</p>
              <p className="mt-0.5 leading-relaxed text-slate-900">{report.message}</p>
            </div>
          </div>
        </section>

        {/* Admin Actions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Process Report</h2>
          <p className="mb-3 text-sm text-slate-500">
            Update the status of this report. Adding notes is required when resolving or marking as unresolved.
          </p>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">Admin Notes</span>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add remarks, resolution details, or reason for status change…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {REPORT_STATUS_OPTIONS.map((status) => {
              const isActive = status === currentStatus
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  disabled={isActive}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                      : status === 'Resolved'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : status === 'Unresolved'
                          ? 'bg-rose-600 text-white hover:bg-rose-500'
                          : status === 'In Progress'
                            ? 'bg-blue-600 text-white hover:bg-blue-500'
                            : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isActive ? `● ${status} (Current)` : status}
                </button>
              )
            })}
          </div>
        </section>

        {/* Processing Timeline */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Processing Timeline</h2>
          <ol className="relative border-l-2 border-slate-200 pl-6">
            {timeline.map((entry, index) => {
              const EntryIcon = STATUS_ICONS[entry.status] || FiClock
              const isLast = index === timeline.length - 1
              return (
                <li key={entry.id} className={`relative ${isLast ? '' : 'pb-6'}`}>
                  <span className="absolute -left-8.25 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-slate-100">
                    <EntryIcon className="text-xs text-slate-600" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{entry.action}</p>
                    <p className="mt-0.5 text-xs text-slate-500"><span className="font-numeric">{entry.date}</span> — by {entry.actor}</p>
                    {entry.note && (
                      <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {entry.note}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      </div>
    </main>
  )
}
