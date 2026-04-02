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
