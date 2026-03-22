export const REPORT_STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Unresolved']

export const REPORT_STATUS_BADGE_CLASSES = {
  Pending: 'bg-cyan-100 text-blue-500 border-blue-200 theme-dark-status-pending',
  'In Progress': 'bg-cyan-200 text-blue-500 border-blue-300 theme-dark-status-in-progress',
  Resolved: 'bg-cyan-500 text-blue-500 border-blue-400 theme-dark-status-resolved',
  Unresolved: 'bg-cyan-600 text-blue-500 border-blue-500 theme-dark-status-unresolved',
}

export const REPORT_URGENCY_BADGE_CLASSES = {
  Emergency: 'bg-blue-900 text-white theme-dark-urgency-emergency',
  Urgent: 'bg-blue-600 text-white theme-dark-urgency-urgent',
  Moderate: 'bg-blue-300 text-white theme-dark-urgency-moderate',
  Calm: 'bg-blue-200 text-white theme-dark-urgency-calm',
}

export function normalizeReportStatus(status) {
  if (!status) {
    return 'Pending'
  }

  return REPORT_STATUS_OPTIONS.includes(status) ? status : 'Pending'
}
