export const REPORT_STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Unresolved']

export const REPORT_STATUS_BADGE_CLASSES = {
  Pending: 'bg-slate-100 text-slate-700 theme-dark-status-pending',
  'In Progress': 'bg-sky-100 text-sky-700 theme-dark-status-in-progress',
  Resolved: 'bg-emerald-100 text-emerald-700 theme-dark-status-resolved',
  Unresolved: 'bg-red-100 text-red-700 theme-dark-status-unresolved',
}

export const REPORT_URGENCY_BADGE_CLASSES = {
  Critical: 'bg-red-500/20 text-red-400',
  High: 'bg-orange-500/20 text-orange-400',
  Medium: 'bg-yellow-500/20 text-yellow-400',
  Low: 'bg-emerald-500/20 text-emerald-400',
}

export const REPORT_EMOTION_OPTIONS = ['Sad', 'Happy', 'Frustrated', 'Angry', 'Disappointed', 'Excited', 'Delighted', 'Neutral']

export const REPORT_EMOTION_BADGE_CLASSES = {
  Sad: 'bg-blue-500/20 text-blue-400',
  Happy: 'bg-emerald-500/20 text-emerald-400',
  Frustrated: 'bg-orange-500/20 text-orange-400',
  Angry: 'bg-red-500/20 text-red-400',
  Disappointed: 'bg-purple-500/20 text-purple-400',
  Excited: 'bg-yellow-500/20 text-yellow-400',
  Delighted: 'bg-teal-500/20 text-teal-400',
  Neutral: 'bg-slate-500/20 text-slate-400',
}

export function normalizeReportStatus(status) {
  if (!status) {
    return 'Pending'
  }

  return REPORT_STATUS_OPTIONS.includes(status) ? status : 'Pending'
}
