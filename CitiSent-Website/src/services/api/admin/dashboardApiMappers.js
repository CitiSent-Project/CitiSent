import { composeFullName } from '../../../models/nameModel'
import { isSuperadmin } from '../../../models/roleAccessModel'

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

export function mapDashboardCategoryBreakdown(payload = {}, fallbackColors = [], profile = null) {
  let rows = Array.isArray(payload?.breakdown) ? payload.breakdown : []

  const isSuper = profile ? isSuperadmin(profile?.role) : true

  if (!isSuper && rows.length > 1) {
    const assignedKey = String(profile?.department || profile?.departmentLabel || profile?.departmentId || '')
      .trim()
      .toLowerCase()

    const matchingRows = rows.filter((row) => {
      const rowId = String(row?.id || '').trim().toLowerCase()
      const rowLabel = String(row?.label || '').trim().toLowerCase()
      const matchesAssigned =
        assignedKey &&
        (rowId === assignedKey ||
          rowLabel === assignedKey ||
          rowLabel.includes(assignedKey) ||
          assignedKey.includes(rowLabel))
      return matchesAssigned || Number(row?.count) > 0
    })

    if (matchingRows.length > 0) {
      rows = matchingRows
    } else {
      const fallback =
        rows.find((r) => {
          const rLabel = String(r?.label || '').toLowerCase()
          return assignedKey && rLabel.includes(assignedKey)
        }) || rows[0]
      rows = fallback ? [fallback] : []
    }
  }

  const labels = rows.map((row) => row.label || 'Unknown')
  const values = rows.map((row) => Number(row.count) || 0)
  const colors = labels.map(
    (_, index) => fallbackColors[index % Math.max(fallbackColors.length, 1)] || '#10b981'
  )

  const totalCalculated = values.reduce((sum, value) => sum + value, 0)
  const totalReports = !isSuper ? totalCalculated : (payload?.totalReports ?? totalCalculated)

  return {
    title: 'Reports by Category',
    total: formatCompactNumber(totalReports),
    labels,
    values,
    colors,
    legend: labels.map((label, index) => ({
      label,
      value: values[index],
      count: values[index],
      color: colors[index],
    })),
  }
}

export function mapDashboardStatusBreakdown(payload = {}) {
  const rows = Array.isArray(payload?.breakdown) ? payload.breakdown : []

  const labelMap = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    'in_review': 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
  }

  const colorMap = {
    pending: '#f59e0b',     // Amber
    'in-progress': '#3b82f6', // Blue
    'in_review': '#3b82f6',   // Blue
    resolved: '#10b981',    // Emerald
    rejected: '#ef4444',    // Red
  }

  const labels = rows.map((row) => labelMap[row.status?.toLowerCase()] || row.status || 'Unknown')
  const values = rows.map((row) => Number(row.count) || 0)
  const colors = rows.map((row) => colorMap[row.status?.toLowerCase()] || '#94a3b8')

  return {
    title: 'Report Status Breakdown',
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
    name:
      composeFullName({ fname: row.fname, mname: row.mname, lname: row.lname }) ||
      row.fullName ||
      row.email ||
      'Unknown Admin',
    email: row.email || 'Not available',
    department: row.departmentLabel || 'Unassigned',
    activity: formatDate(row.joinedAt),
  }))
}

export function mapDashboardRecentUsers(payload = []) {
  const rows = Array.isArray(payload) ? payload : []

  return rows.map((row) => ({
    username:
      composeFullName({ fname: row.fname, mname: row.mname, lname: row.lname }) ||
      row.fullName ||
      row.username ||
      row.email ||
      'Unknown User',
    joined: formatDate(row.joinedAt),
  }))
}
