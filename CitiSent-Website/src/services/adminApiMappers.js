import { normalizeReportStatus } from '../models/reportStatusModel'
import { DEPARTMENT_OPTIONS } from '../models/data'

const REPORT_STATUS_LABEL_MAP = {
  pending: 'Pending',
  in_review: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Unresolved',
}

const BACKEND_TO_UI_USER_STATUS = {
  active: 'Active',
  banned: 'Banned',
}

const UI_TO_BACKEND_USER_STATUS = {
  Active: 'active',
  Banned: 'banned',
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

function normalizeUserStatusLabel(status) {
  const normalizedStatus = String(status || '').trim().toLowerCase()
  return BACKEND_TO_UI_USER_STATUS[normalizedStatus] || 'Active'
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

export function mapBackendUserToUiRow(payload = {}) {
  const joinedAtValue = Date.parse(payload.joinedAt || payload.updatedAt || '')

  return {
    id: payload.id || '',
    name: payload.fullName || payload.username || payload.email || 'Unknown User',
    email: payload.email || 'Not available',
    address: payload.address || 'Not available',
    status: normalizeUserStatusLabel(payload.status),
    registeredAt: formatDate(payload.joinedAt),
    registeredAtValue: Number.isNaN(joinedAtValue) ? 0 : joinedAtValue,
    username: payload.username || '',
    role: payload.role || '',
    accountType: payload.accountType || '',
    phoneNumber: payload.phoneNumber || '',
    departmentLabel: payload.departmentLabel || '',
    departmentId: payload.departmentId || '',
    ban: payload.ban || null,
    joinedAt: payload.joinedAt || '',
    updatedAt: payload.updatedAt || '',
  }
}

export function mapUiStatusToBackendUserStatus(status) {
  return UI_TO_BACKEND_USER_STATUS[String(status || '').trim()] || 'active'
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

function formatCompactNumber(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return '0'
  }

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(numericValue)
}

export function mapDashboardSummaryToStatCards(payload = {}, templateCards = []) {
  const totals = payload?.totals || {}
  const metricByCardId = {
    'total-users': totals.totalUsers,
    'ongoing-reports': totals.ongoingReports,
    'reports-resolved': totals.reportsResolved,
    'total-reports': totals.totalReports,
  }

  return templateCards.map((card) => ({
    ...card,
    value: formatCompactNumber(metricByCardId[card.id] ?? 0),
  }))
}

export function mapDashboardCategoryBreakdown(payload = {}, fallbackColors = []) {
  const rows = Array.isArray(payload?.breakdown) ? payload.breakdown : []

  const labels = rows.map((row) => row.label || 'Unknown')
  const values = rows.map((row) => Number(row.count) || 0)
  const colors = labels.map(
    (_, index) => fallbackColors[index % Math.max(fallbackColors.length, 1)] || '#94a3b8'
  )

  return {
    title: 'Reports by Category',
    total: formatCompactNumber(payload?.totalReports ?? values.reduce((sum, value) => sum + value, 0)),
    labels,
    values,
    colors,
    legend: labels.map((label, index) => ({
      label,
      color: colors[index],
    })),
  }
}

export function mapDashboardWeeklyTrend(payload = {}) {
  return {
    title: 'Total Reports This Week',
    labels: Array.isArray(payload?.labels) ? payload.labels : [],
    values: Array.isArray(payload?.values)
      ? payload.values.map((value) => Number(value) || 0)
      : [],
  }
}

export function mapDashboardRecentAdmins(payload = []) {
  const rows = Array.isArray(payload) ? payload : []

  return rows.map((row) => ({
    name: row.fullName || row.email || 'Unknown Admin',
    email: row.email || 'Not available',
    department: row.departmentLabel || 'Unassigned',
    activity: formatDate(row.joinedAt),
  }))
}

export function mapDashboardRecentUsers(payload = []) {
  const rows = Array.isArray(payload) ? payload : []

  return rows.map((row) => ({
    username: row.fullName || row.username || row.email || 'Unknown User',
    joined: formatDate(row.joinedAt),
  }))
}
