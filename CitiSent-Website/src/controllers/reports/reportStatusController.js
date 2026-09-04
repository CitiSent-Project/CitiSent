import { normalizeReportStatus } from '../models/reportStatusModel'

export function initializeReportRows(rows = []) {
  return rows.map((row) => ({ ...row, status: normalizeReportStatus(row.status) }))
}

export function updateReportStatusInRows(rows = [], reportId, nextStatus) {
  const normalizedStatus = normalizeReportStatus(nextStatus)
  return rows.map((row) =>
    row.id === reportId ? { ...row, status: normalizedStatus } : row
  )
}

export function validateReportStatusChange({ currentStatus, nextStatus, adminNotes }) {
  const normalizedCurrent = normalizeReportStatus(currentStatus)
  const normalizedNext = normalizeReportStatus(nextStatus)

  if (normalizedNext === normalizedCurrent) {
    return {
      ok: false,
      title: 'Status unchanged.',
      message: 'Select a different status to update this report.',
    }
  }

  const requiresNotes = normalizedNext === 'Resolved' || normalizedNext === 'Unresolved'
  if (requiresNotes && !String(adminNotes || '').trim()) {
    return {
      ok: false,
      title: 'Notes required.',
      message: `Add admin notes before marking a report as ${normalizedNext}. This helps track the resolution.`,
    }
  }

  return { ok: true, nextStatus: normalizedNext }
}

export function createReportTimelineEntry({ nextStatus, adminNotes, actor = 'Admin' }) {
  const note = String(adminNotes || '').trim() || `Status updated to ${nextStatus}.`
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })

  return {
    action: `Status changed to ${nextStatus}`,
    status: nextStatus,
    note,
    date,
    actor,
  }
}
