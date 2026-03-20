export const REPORT_STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Unresolved']

export const REPORT_STATUS_BADGE_CLASSES = {
  Pending: 'bg-blue-50 text-blue-700 border-blue-200 theme-dark-status-pending',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-300 theme-dark-status-in-progress',
  Resolved: 'bg-blue-200 text-blue-900 border-blue-400 theme-dark-status-resolved',
  Unresolved: 'bg-blue-300 text-blue-950 border-blue-500 theme-dark-status-unresolved',
}

export const REPORT_URGENCY_BADGE_CLASSES = {
  Emergency: 'bg-blue-900 text-white theme-dark-urgency-emergency',
  Urgent: 'bg-blue-600 text-white theme-dark-urgency-urgent',
  Moderate: 'bg-blue-300 text-blue-700 theme-dark-urgency-moderate',
  Calm: 'bg-blue-200 text-blue-400 theme-dark-urgency-calm',
}

export function normalizeReportStatus(status) {
  if (!status) {
    return 'Pending'
  }

  return REPORT_STATUS_OPTIONS.includes(status) ? status : 'Pending'
}
