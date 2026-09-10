import { FiChevronRight, FiCheckCircle, FiClock, FiAlertCircle, FiFileText, FiCpu, FiImage, FiX, FiAlertTriangle, FiMessageCircle, FiRefreshCw } from 'react-icons/fi'
import {
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_OPTIONS,
  REPORT_URGENCY_BADGE_CLASSES,
  REPORT_EMOTION_BADGE_CLASSES,
} from '../../models/reportStatusModel'
import { ReportChatDrawer } from './ReportChatDrawer'
import { useReportDetailState } from '../../hooks/reports/useReportDetailState'

const STATUS_ICONS = {
  Pending: FiClock,
  'In Progress': FiFileText,
  Resolved: FiCheckCircle,
  Rejected: FiAlertCircle,
}

/**
 * ReportDetailPage
 *
 * Presentation component for an individual report. All stateful side
 * effects (API calls, timers, storage reads, admin-note suggestions)
 * live in the `useReportDetailState` hook — this component handles
 * rendering and event wiring only.
 *
 * Props are intentionally unchanged from the original contract:
 * @param {object}   report          - Report data (or null when missing).
 * @param {object}   profile         - Current admin profile.
 * @param {Function} onBackToReports - Navigate back to the reports list.
 * @param {Function} onUpdateStatus  - Persist a status change through the orchestrator.
 */
export function ReportDetailPage({ report, profile, onBackToReports, onUpdateStatus }) {
  const {
    // State values
    accessToken,
    adminNotes,
    selectedStatus,
    isSaving,
    isImageModalOpen,
    isVerificationModalOpen,
    pendingValidation,
    isChatOpen,
    adminNoteSuggestions,
    isAdminNoteSuggestionsLoading,
    timeline,
    unreadChatCount,

    // Derived values
    currentStatus,
    isPermanentlyLocked,
    canProcessReport,
    canChat,
    isSaveDisabled,

    // Setters
    setAdminNotes,
    setSelectedStatus,
    setIsImageModalOpen,

    // Actions
    handleStatusSave,
    executeStatusSave,
    handleOpenChat,
    handleCloseChat,
    handleCloseVerification,
    loadAdminNoteSuggestions,
  } = useReportDetailState({ report, profile, onUpdateStatus })

  // ---------------------------------------------------------------------------
  // "Not found" fallback when the report is null/undefined.
  // ---------------------------------------------------------------------------
  if (!report) {
    return (
      <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8 dark:bg-slate-900 transition-colors duration-200">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/90">
          <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <button onClick={onBackToReports} className="hover:text-slate-700 transition-colors dark:hover:text-slate-300">
              Reports
            </button>
            <FiChevronRight className="text-xs" />
            <span className="text-slate-700 dark:text-slate-300">Report Detail</span>
          </nav>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Report not found</h1>
        </div>
      </main>
    )
  }

  const StatusIcon = STATUS_ICONS[currentStatus] || FiClock

  return (
    <main className="mx-auto max-w-7xl flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8 dark:bg-slate-900 transition-colors duration-200">
      <div className="flex flex-col gap-6">
        <nav className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
          <button onClick={onBackToReports} className="transition-colors hover:text-slate-700 dark:hover:text-slate-300">
            Reports
          </button>
          <FiChevronRight className="text-xs" />
          <span className="font-medium text-slate-700 dark:text-slate-300">Report Detail</span>
          <FiChevronRight className="text-xs" />
          <span className="font-numeric text-slate-400">{report.reportNum || report.id}</span>
        </nav>

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Report <span className="font-numeric">{report.reportNum || report.id}</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Submitted on <span className="font-numeric font-medium">{report.date}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-xs ${REPORT_STATUS_BADGE_CLASSES[currentStatus]}`}
            >
              <StatusIcon className="text-sm" />
              {currentStatus}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold shadow-xs ${REPORT_EMOTION_BADGE_CLASSES[report.emotionLevel] || 'border border-slate-500/30 bg-slate-500/10 text-slate-500 dark:border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400'}`}
            >
              {report.emotionLevel || 'Neutral'}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold shadow-xs ${REPORT_URGENCY_BADGE_CLASSES[report.urgency] || 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'}`}
            >
              {report.urgency}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/95">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <FiFileText className="text-blue-500" />
                Report Information
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800">
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Report ID</p>
                  <p className="mt-1 font-numeric font-medium text-slate-900 dark:text-slate-200">{report.reportNum || report.id}</p>
                </div>
                <div className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800">
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Reported By</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">{report.name}</p>
                </div>
                <div className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800">
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">{report.email}</p>
                </div>
                <div className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800">
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Location</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">{report.location}</p>
                </div>
                <div className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800">
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Category / Agency</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">{report.category}</p>
                </div>
                <div className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800">
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Source</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">{report.source}</p>
                </div>
                <div className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800">
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Emotion Status</p>
                  <p className="mt-1">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${REPORT_EMOTION_BADGE_CLASSES[report.emotionLevel] || 'border border-slate-500/30 bg-slate-500/10 text-slate-500 dark:border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400'}`}>
                      {report.emotionLevel || 'Neutral'}
                    </span>
                  </p>
                </div>
                <div className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800">
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Urgency Level</p>
                  <p className="mt-1">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${REPORT_URGENCY_BADGE_CLASSES[report.urgency] || 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'}`}>
                      {report.urgency}
                    </span>
                  </p>
                </div>
                <div className={`group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800 ${report.attachmentUrl ? "" : "sm:col-span-2"}`}>
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Message</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">{report.message}</p>
                </div>
                {report.attachmentUrl ? (
                  <div className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800">
                    <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Attachment</p>
                    <button
                      type="button"
                      onClick={() => setIsImageModalOpen(true)}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      aria-label="View attached image"
                    >
                      <FiImage className="text-slate-500 dark:text-slate-400" />
                      View Attached Image
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            {report.aiSummary ? (
              <section className="relative overflow-hidden rounded-2xl border border-blue-200 bg-linear-to-br from-blue-50 to-blue-50 p-6 shadow-sm dark:border-blue-900/50 dark:from-blue-900/20 dark:to-blue-900/20">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-700/20" />
                <div className="relative mb-4 flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                    <FiCpu className="text-sm" />
                  </span>
                  <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">AI Summary</h2>
                </div>
                <p className="relative text-sm leading-relaxed text-slate-800 dark:text-slate-200">{report.aiSummary}</p>
              </section>
            ) : null}

            <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/95">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <FiClock className="text-slate-400" />
                Processing Timeline
              </h2>
              <ol className="relative ml-3 border-l-2 border-slate-100 dark:border-slate-700">
                {timeline.map((entry, index) => {
                  const EntryIcon = STATUS_ICONS[entry.status] || FiClock
                  const isLast = index === timeline.length - 1

                  return (
                    <li key={entry.id} className={`relative ${isLast ? '' : 'pb-8'}`}>
                      <span className="absolute -left-9 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-700">
                        <EntryIcon className="text-sm text-slate-500 dark:text-slate-400" />
                      </span>
                      <div className="ml-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{entry.action}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-numeric">{entry.date}</span> - by {entry.actor}
                        </p>
                        {entry.note ? (
                          <p className="mt-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50">
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

          {/* Right Column (Sticky) */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-6 lg:col-span-1">
            <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/95">
              <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Process Report</h2>
              <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
                Update the status. Adding notes is required when resolving or marking as rejected.
              </p>

              {!canProcessReport && !isPermanentlyLocked ? (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
                  <FiAlertTriangle className="mt-0.5 shrink-0 text-amber-500" />
                  <p>You can view this report, but only admins assigned to this department can change its status.</p>
                </div>
              ) : null}

              {isPermanentlyLocked ? (
                <div className={`mb-5 flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${currentStatus === 'Resolved' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300' : ' bg-rose-50 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300'}`}>
                  <FiCheckCircle className="mt-0.5 shrink-0" />
                  <p>This report is permanently locked because it was marked as {currentStatus}. No further changes can be made.</p>
                </div>
              ) : null}

              <div className="mb-6 flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</span>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_STATUS_OPTIONS.map((status) => {
                    const isCurrent = status === currentStatus
                    const isSelected = status === selectedStatus

                    return (
                      <label
                        key={status}
                        className={`group relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all ${!canProcessReport
                            ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-70 dark:border-slate-700 dark:bg-slate-800/50'
                            : isSelected
                              ? 'border-blue-600 bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-600 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500'
                              : 'border-slate-200 bg-white font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700'
                          }`}
                      >
                        <input
                          type="radio"
                          name="report-status"
                          value={status}
                          checked={isSelected}
                          onChange={(event) => setSelectedStatus(event.target.value)}
                          disabled={!canProcessReport}
                          className="sr-only"
                        />
                        <span className="flex flex-col items-center gap-1 text-center">
                          {isCurrent && <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm dark:bg-slate-100 dark:text-slate-900">Current</span>}
                          {status}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="mb-5">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Admin Notes</span>
                <textarea
                  rows={4}
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  placeholder="Add remarks, resolution details, or reason for status change..."
                  disabled={!canProcessReport}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:bg-slate-900"
                />
              </div>

              {canProcessReport ? (
                <div className="relative mb-6 overflow-hidden rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50 via-white to-sky-50 p-5 shadow-[0_8px_24px_rgba(79,70,229,0.08)] dark:border-blue-900/50 dark:from-blue-900/20 dark:via-slate-800 dark:to-blue-900/10 dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-600/20" />
                  <div className="relative mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30">
                        <FiCpu className="text-base" />
                      </span>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100">Note copilot</span>
                          <span className="text-end rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">AI assist</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Choose a starting point, then tailor it to the action taken.</p>
                      </div>
                    </div>
                  </div>
                  {isAdminNoteSuggestionsLoading ? (
                    <div className="relative flex items-center gap-2.5 rounded-xl border border-blue-100/50 bg-white/60 px-4 py-3.5 text-xs text-slate-500 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-400">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                      Shaping notes from the report context...
                    </div>
                  ) : adminNoteSuggestions.length > 0 ? (
                    <div className="relative flex flex-col gap-2.5">
                      {adminNoteSuggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.rank}-${index}`}
                          type="button"
                          onClick={() => setAdminNotes(suggestion.text)}
                          className={`group rounded-xl border bg-white/90 p-3.5 text-left text-xs leading-relaxed text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/90 dark:text-slate-300 ${index === 0 ? 'border-blue-300 ring-1 ring-blue-100 hover:border-blue-400 dark:border-blue-700 dark:ring-blue-900/50' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'}`}
                        >
                          <span className="mb-2 flex items-center justify-between gap-2">
                            {index === 0 ? <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">Best fit</span> : <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Option {index + 1}</span>}
                            <span className="text-blue-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600 dark:text-blue-500 dark:group-hover:text-blue-400">→</span>
                          </span>
                          <span className="block">{suggestion.text}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="relative rounded-xl border border-white/80 bg-white/70 px-4 py-3 text-xs text-slate-500 dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-400">Suggestions are unavailable right now. You can still enter a note manually.</p>
                  )}
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleStatusSave}
                  disabled={isSaveDisabled}
                  className={`flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all ${isSaveDisabled
                      ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                      : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-[0.98]'
                    }`}
                >
                  {isSaving ? (
                    <>
                      <FiRefreshCw className="mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Status'}
                </button>

                {canChat ? (
                  <button
                    type="button"
                    onClick={handleOpenChat}
                    disabled={isPermanentlyLocked}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-blue-600 focus:outline-none focus:ring-4 focus:ring-slate-500/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <FiMessageCircle className="text-lg" />
                    <span>Talk to User</span>
                    {unreadChatCount > 0 && !isPermanentlyLocked && (
                      <span className="ml-auto flex items-center gap-1 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        {unreadChatCount > 1 ? unreadChatCount : 'New'}
                      </span>
                    )}
                  </button>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Image Modal Overlay */}
      {isImageModalOpen && report.attachmentUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setIsImageModalOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="animate-in fade-in zoom-in-95 relative max-h-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close image modal"
            >
              <FiX className="text-lg" />
            </button>
            <img
              src={report.attachmentUrl}
              alt="Attached report evidence"
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      ) : null}

      {/* Status Verification Modal Overlay */}
      {isVerificationModalOpen && pendingValidation ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity"
          aria-modal="true"
          role="dialog"
        >
          <div className="animate-in fade-in zoom-in-95 relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
            <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${pendingValidation.nextStatus === 'Resolved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
              {pendingValidation.nextStatus === 'Resolved' ? (
                <FiCheckCircle className="text-3xl" />
              ) : (
                <FiAlertTriangle className="text-3xl" />
              )}
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Mark as {pendingValidation.nextStatus}?</h3>
            <p className="mb-8 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Are you sure you want to mark this report as <strong className="font-semibold">{pendingValidation.nextStatus}</strong>? This action is irreversible and will permanently lock the report from further updates.
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleCloseVerification}
                disabled={isSaving}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeStatusSave(pendingValidation)}
                disabled={isSaving}
                className={`flex flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${pendingValidation.nextStatus === 'Resolved'
                    ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/20'
                    : 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/20'
                  }`}
              >
                {isSaving ? <FiRefreshCw className="mr-2 animate-spin" /> : null}
                {isSaving ? 'Processing...' : 'Confirm & Lock'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      
      {isChatOpen ? <ReportChatDrawer report={report} profile={profile} token={accessToken} onClose={handleCloseChat} /> : null}
    </main>
  )
}
