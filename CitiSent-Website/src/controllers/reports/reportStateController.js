import { normalizeReportStatus } from '../../models/reportStatusModel'

export function buildViewedReport({ report, reportStatusMap }) {
  const mappedStatus = reportStatusMap[report.id] || report.status
  return {
    ...report,
    status: normalizeReportStatus(mappedStatus),
  }
}

export function buildNextReportStatusMap({ reportStatusMap, reportId, nextStatus }) {
  const normalizedStatus = normalizeReportStatus(nextStatus)
  return { ...reportStatusMap, [reportId]: normalizedStatus }
}

export function buildNextSelectedReport({ selectedReport, reportId, nextStatus }) {
  const normalizedStatus = normalizeReportStatus(nextStatus)
  return (
    selectedReport && selectedReport.id === reportId
      ? { ...selectedReport, status: normalizedStatus }
      : selectedReport
  )
}
