import { normalizeReportStatus } from '../models/reportStatusModel'
import { DEPARTMENT_OPTIONS } from '../models/data'

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
  const byId = DEPARTMENT_OPTIONS.find((department) => department.id === departmentId)
  if (byId) {
    return byId
  }

  const byLabel = DEPARTMENT_OPTIONS.find(
    (department) => department.label === departmentLabel || department.label === issueType
  )

  if (byLabel) {
    return byLabel
  }

  return {
    id: departmentId || issueType || 'unassigned',
    label: departmentLabel || issueType || 'Unassigned',
  }
}

export function mapBackendProfileToAdminProfile(payload = {}) {
  return {
    id: payload.id || '',
    fullName: payload.fullName || payload.username || '',
    email: payload.email || '',
    departmentId: payload.departmentId || '',
    department: payload.departmentLabel || '',
    role: payload.role || '',
    phone: payload.phoneNumber || '',
    address: payload.address || '',
    joinedAt: payload.joinedAt || '',
    lastLoginAt: payload.lastLoginAt || '',
    accountType: payload.accountType || '',
  }
}

export function mapBackendOfficeAdmin(payload = {}) {
  return {
    id: payload.id || '',
    fullName: payload.fullName || '',
    email: payload.email || '',
    departmentId: payload.departmentId || '',
    department: payload.departmentLabel || '',
    role: payload.role || '',
    phone: payload.phoneNumber || '',
    address: payload.address || '',
    joinedAt: payload.joinedAt || '',
    lastLoginAt: payload.lastLoginAt || '',
  }
}

export function mapBackendTransferRequest(payload = {}) {
  const statusMap = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  }

  return {
    id: payload.id || '',
    adminId: payload.adminId || '',
    adminName: payload.adminName || '',
    currentDepartmentId: payload.currentDepartmentId || '',
    currentDepartmentLabel: payload.currentDepartmentLabel || '',
    requestedDepartmentId: payload.requestedDepartmentId || '',
    requestedDepartmentLabel: payload.requestedDepartmentLabel || '',
    reason: payload.reason || '',
    status: statusMap[payload.status] || payload.status || 'Pending',
    requestedAt: payload.createdAt || '',
    reviewedAt: payload.reviewedAt || '',
    reviewedById: payload.reviewerId || '',
    reviewedByName: payload.reviewerName || '',
    reviewNotes: payload.reviewNotes || '',
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
