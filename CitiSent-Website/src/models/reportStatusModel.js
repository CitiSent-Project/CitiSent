export const REPORT_STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Rejected']

export const REPORT_STATUS_BADGE_CLASSES = {
  Pending: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  'In Progress': 'bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  Resolved: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  Rejected: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
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
