export const REPORT_STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Unresolved']

export const REPORT_STATUS_BADGE_CLASSES = {
  Pending: 'bg-slate-100 text-slate-700 border border-slate-200 theme-dark-status-pending',
  'In Progress': 'bg-sky-100 text-sky-700 border border-sky-200 theme-dark-status-in-progress',
  Resolved: 'bg-emerald-100 text-emerald-700 border border-emerald-200 theme-dark-status-resolved',
  Unresolved: 'bg-red-100 text-red-700 border border-red-200 theme-dark-status-unresolved',
}

export const REPORT_URGENCY_BADGE_CLASSES = {
  Critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
  High: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  Low: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
}

export const REPORT_EMOTION_OPTIONS = ['Sad', 'Happy', 'Frustrated', 'Angry', 'Disappointed', 'Excited', 'Delighted', 'Neutral']

export const REPORT_EMOTION_BADGE_CLASSES = {
  Sad: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  Happy: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  Frustrated: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  Angry: 'bg-red-500/20 text-red-400 border border-red-500/30',
  Disappointed: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  Excited: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  Delighted: 'bg-teal-500/20 text-teal-400 border border-teal-500/30',
  Neutral: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
}

export function normalizeReportStatus(status) {
  if (!status) {
    return 'Pending'
  }

  return REPORT_STATUS_OPTIONS.includes(status) ? status : 'Pending'
}
