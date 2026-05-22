export const REPORT_STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Unresolved']

export const REPORT_STATUS_BADGE_CLASSES = {
  Pending: 'bg-cyan-100 text-blue-500 border-blue-200 theme-dark-status-pending',
  'In Progress': 'bg-cyan-200 text-blue-500 border-blue-300 theme-dark-status-in-progress',
  Resolved: 'bg-cyan-500 text-blue-500 border-blue-400 theme-dark-status-resolved',
  Unresolved: 'bg-cyan-600 text-blue-500 border-blue-500 theme-dark-status-unresolved',
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
