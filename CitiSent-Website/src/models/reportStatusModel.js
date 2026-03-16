export const REPORT_STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Unresolved']

export const REPORT_STATUS_BADGE_CLASSES = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-300',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-300',
  Resolved: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  Unresolved: 'bg-rose-100 text-rose-700 border-rose-300',
}

export const REPORT_URGENCY_BADGE_CLASSES = {
  Emergency: 'bg-red-100 text-red-700',
  Urgent: 'bg-orange-100 text-orange-700',
  Moderate: 'bg-yellow-100 text-yellow-700',
  'Low Priority': 'bg-green-100 text-green-700',
  Calm: 'bg-sky-100 text-sky-700',
}

export function normalizeReportStatus(status) {
  if (!status) {
    return 'Pending'
  }

  return REPORT_STATUS_OPTIONS.includes(status) ? status : 'Pending'
}
