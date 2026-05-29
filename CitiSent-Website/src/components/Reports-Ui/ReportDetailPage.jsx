import { useEffect, useRef, useState } from 'react'
import { FiChevronRight, FiCheckCircle, FiClock, FiAlertCircle, FiFileText, FiCpu } from 'react-icons/fi'
import { notifySuccess, notifyError } from '../ui/toastHelpers'
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_OPTIONS,
  REPORT_URGENCY_BADGE_CLASSES,
  REPORT_EMOTION_BADGE_CLASSES,
  normalizeReportStatus,
} from '../../models/reportStatusModel'
import {
  createReportTimelineEntry,
  validateReportStatusChange,
} from '../../controllers/reportStatusController'
import { canAdminUpdateReport } from '../../controllers/reportAccessController'

const STATUS_ICONS = {
  Pending: FiClock,
  'In Progress': FiFileText,
  Resolved: FiCheckCircle,
  Unresolved: FiAlertCircle,
}

export function ReportDetailPage({ report, profile, onBackToReports, onUpdateStatus }) {
  const [adminNotes, setAdminNotes] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(() => normalizeReportStatus(report?.status))
  const [isSaving, setIsSaving] = useState(false)
  const [isCooldown, setIsCooldown] = useState(false)
  const cooldownTimerRef = useRef(null)
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
            <button onClick={onBackToReports} className="hover:text-slate-700 transition-colors">
              Reports
            </button>
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
  const canProcessReport = canAdminUpdateReport({ profile, report })
  const isSaveDisabled =
    !canProcessReport || selectedStatus === currentStatus || isSaving || isCooldown

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        window.clearTimeout(cooldownTimerRef.current)
        cooldownTimerRef.current = null
      }
    }
  }, [])

  function startCooldown() {
    if (cooldownTimerRef.current) {
      window.clearTimeout(cooldownTimerRef.current)
    }

    setIsCooldown(true)
    cooldownTimerRef.current = window.setTimeout(() => {
      setIsCooldown(false)
      cooldownTimerRef.current = null
    }, 1000)
  }

  async function handleStatusSave() {
    if (isSaving || isCooldown) {
      return
    }

    if (!canProcessReport) {
      notifyError('Status update denied.', 'You can only process reports assigned to your department.')
      return
    }

    if (selectedStatus === currentStatus) {
      return
    }

    const validation = validateReportStatusChange({
      currentStatus,
      nextStatus: selectedStatus,
      adminNotes,
    })

    if (!validation.ok) {
      notifyError(validation.title, validation.message)
      return
    }

    startCooldown()
    setIsSaving(true)

    try {
      const result = await onUpdateStatus(report.id, validation.nextStatus)
      if (!result?.ok) {
        return
      }

      setTimeline((previous) => [
        ...previous,
        {
          id: previous.length + 1,
          ...createReportTimelineEntry({
            nextStatus: validation.nextStatus,
            adminNotes,
          }),
        },
      ])

      notifySuccess(`Report ${report.id} marked as ${validation.nextStatus}.`)
      setAdminNotes('')
      setSelectedStatus(validation.nextStatus)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <nav className="flex items-center gap-1 text-sm text-slate-500">
          <button onClick={onBackToReports} className="hover:text-slate-700 transition-colors">
            Reports
          </button>
          <FiChevronRight className="text-xs" />
          <span className="text-slate-700 font-medium">Report Detail</span>
          <FiChevronRight className="text-xs" />
          <span className="text-slate-400 font-numeric">{report.id}</span>
        </nav>

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Report <span className="font-numeric">{report.id}</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Submitted on <span className="font-numeric">{report.date}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${REPORT_STATUS_BADGE_CLASSES[currentStatus]}`}
            >
              <StatusIcon className="text-sm" />
              {currentStatus}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${REPORT_EMOTION_BADGE_CLASSES[report.emotionLevel] || 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}
            >
              {report.emotionLevel || 'Neutral'}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${REPORT_URGENCY_BADGE_CLASSES[report.urgency] || 'bg-blue-50 text-blue-700'}`}
            >
              {report.urgency}
            </span>
          </div>
        </header>

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
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Emotion Level</p>
              <p className="mt-0.5">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${REPORT_EMOTION_BADGE_CLASSES[report.emotionLevel] || 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
                  {report.emotionLevel || 'Neutral'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Urgency Level</p>
              <p className="mt-0.5">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${REPORT_URGENCY_BADGE_CLASSES[report.urgency] || ''}`}>
                  {report.urgency}
                </span>
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Message</p>
              <p className="mt-0.5 leading-relaxed text-slate-900">{report.message}</p>
            </div>
          </div>
        </section>

        {report.aiSummary ? (
          <section className="rounded-2xl border border-blue-800 bg-blue-50 p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600">
                <FiCpu className="text-sm text-white" />
              </span>
              <h2 className="text-lg font-semibold text-blue-900">AI Summary</h2>
              <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                Powered by Gemini
              </span>
            </div>
            <p className="leading-relaxed text-sm text-slate-900">{report.aiSummary}</p>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Process Report</h2>
          <p className="mb-3 text-sm text-slate-500">
            Update the status of this report. Adding notes is required when resolving or marking as unresolved.
          </p>
          {!canProcessReport ? (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              You can view this report, but only admins assigned to this department can change its status.
            </p>
          ) : null}

          <label className="mb-3 block">
            <span className="mb-1 block text-xs uppercase tracking-wide text-slate-500">Admin Notes</span>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              placeholder="Add remarks, resolution details, or reason for status change..."
              disabled={!canProcessReport}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {REPORT_STATUS_OPTIONS.map((status) => {
              const isCurrent = status === currentStatus
              const isSelected = status === selectedStatus

              return (
                <label
                  key={status}
                  className={`shrink-0 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${!canProcessReport
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                      : isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <input
                    type="radio"
                    name="report-status"
                    value={status}
                    checked={isSelected}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                    disabled={!canProcessReport}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className={isCurrent ? 'font-semibold' : ''}>
                    {isCurrent ? `${status} (Current)` : status}
                  </span>
                </label>
              )
            })}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleStatusSave}
              disabled={isSaveDisabled}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isSaveDisabled
                  ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                  : 'bg-blue-700 text-white hover:bg-blue-600'
                }`}
            >
              {isSaving ? 'Saving...' : 'Save Status'}
            </button>
          </div>
        </section>

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
                    <p className="mt-0.5 text-xs text-slate-500">
                      <span className="font-numeric">{entry.date}</span> - by {entry.actor}
                    </p>
                    {entry.note ? (
                      <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {entry.note}
                      </p>
                    ) : null}
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
