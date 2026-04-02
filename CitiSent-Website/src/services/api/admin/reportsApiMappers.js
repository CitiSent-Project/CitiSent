import { normalizeReportStatus } from '../../../models/reportStatusModel'

const REPORT_STATUS_LABEL_MAP = {
  pending: 'Pending',
  in_review: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Unresolved',
}

function formatDate(value) {
  if (!value) {
    return 'Not available'
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })
}

function resolveDepartment(departmentId, departmentLabel, issueType) {
  const normalizedDepartmentId = String(departmentId || '').trim()
  const normalizedDepartmentLabel = String(departmentLabel || issueType || '').trim()

  return {
    id: normalizedDepartmentId || 'unassigned',
    label: normalizedDepartmentLabel || 'Unassigned',
  }
}

export function mapBackendReportToUiRow(payload = {}) {
  const department = resolveDepartment(
    payload.departmentId,
    payload.departmentLabel,
    payload.issueType
  )
  const dateValue = Date.parse(payload.createdAt || '')

  return {
    id: payload.id || '',
    reportNum: payload.id || '',
    userId: payload.reporter?.id || '',
    name: payload.reporter?.fullName || 'Unknown Reporter',
    email: payload.reporter?.email || 'unknown@citisent.gov',
    location: payload.location || 'Not specified',
    date: formatDate(payload.createdAt),
    dateValue: Number.isNaN(dateValue) ? Date.now() : dateValue,
    categoryId: department.id,
    category: department.label,
    source: payload.source || 'Website',
    message: payload.description || '',
    urgency: payload.urgency || 'Calm',
    status: normalizeReportStatus(
      REPORT_STATUS_LABEL_MAP[payload.status] || payload.statusLabel || payload.status
    ),
    issueType: payload.issueType || department.label,
    attachmentUrl: payload.attachmentUrl || null,
    backendStatus: payload.status || 'pending',
    createdAt: payload.createdAt || '',
    updatedAt: payload.updatedAt || '',
  }
}

export function mapUiStatusToBackendStatus(status) {
  const normalizedStatus = String(status || '').trim().toLowerCase()

  if (normalizedStatus === 'in progress') {
    return 'in_review'
  }

  if (normalizedStatus === 'unresolved') {
    return 'rejected'
  }

  if (normalizedStatus === 'resolved') {
    return 'resolved'
  }

  return 'pending'
}
