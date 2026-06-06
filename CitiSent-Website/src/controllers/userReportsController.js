export const ALL_URGENCY_FILTER = 'All Reports'
export const REPORT_SORTING_OPTIONS = {
  LATEST_FIRST: 'Latest first',
  OLDEST_FIRST: 'Oldest first',
  HIGHEST_URGENCY: 'Highest urgency',
}

const URGENCY_RANKS = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Moderate: 2,
  Low: 1,
}

function formatReportDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })
}

export function buildUserReportRows({ userReports = [], users = [], agencies = [] }) {
  const usersById = users.reduce((accumulator, user) => {
    accumulator[user.userId] = user
    return accumulator
  }, {})

  const agenciesById = agencies.reduce((accumulator, agency) => {
    accumulator[agency.id] = agency.label
    return accumulator
  }, {})

  return userReports.map((report) => {
    const reportNumber = Number(report.reportNum)
    const safeReportNumber = Number.isNaN(reportNumber) ? 0 : reportNumber
    const user = usersById[report.userId] || {}
    const fullName = `${user.firstName || 'Unknown'} ${user.lastName || 'User'}`.trim()
    const createdAt = Date.parse(report.createdAt)
    const safeCreatedAt = Number.isNaN(createdAt) ? Date.now() : createdAt

    return {
      id: `UR-${String(safeReportNumber)}`,
      reportNum: safeReportNumber,
      userId: report.userId,
      name: fullName,
      email: user.email || 'unknown@citisent.gov',
      location: report.reportLocation || 'Not specified',
      date: formatReportDate(report.createdAt || safeCreatedAt),
      dateValue: safeCreatedAt,
      categoryId: report.reportCategory,
      category: agenciesById[report.reportCategory] || report.reportCategory,
      source: report.source || 'Website',
      message: report.reportDescription,
      urgency: report.urgencyType,
      status: report.status || 'Pending',
    }
  })
}

export function sortReportsByLatest(rows = []) {
  return [...rows].sort((a, b) => Number(b?.dateValue || 0) - Number(a?.dateValue || 0))
}

export function sortReports(rows = [], sorting = REPORT_SORTING_OPTIONS.LATEST_FIRST) {
  if (sorting === REPORT_SORTING_OPTIONS.OLDEST_FIRST) {
    return [...rows].sort((a, b) => Number(a?.dateValue || 0) - Number(b?.dateValue || 0))
  }

  if (sorting === REPORT_SORTING_OPTIONS.HIGHEST_URGENCY) {
    return [...rows].sort((a, b) => {
      const urgencyDifference =
        Number(URGENCY_RANKS[b?.urgency] || 0) - Number(URGENCY_RANKS[a?.urgency] || 0)

      return urgencyDifference || Number(b?.dateValue || 0) - Number(a?.dateValue || 0)
    })
  }

  return sortReportsByLatest(rows)
}

export function filterUserReportsByCategory({
  reports = [],
  selectedCategoryId,
  hasAllAccess = false,
  allCategoryFilterId,
  sorting = REPORT_SORTING_OPTIONS.LATEST_FIRST,
}) {
  const effectiveCategoryId = String(selectedCategoryId || '')

  if (hasAllAccess && effectiveCategoryId === allCategoryFilterId) {
    return sortReports(reports, sorting)
  }

  return sortReports(
    reports.filter((row) => String(row?.categoryId || '') === effectiveCategoryId),
    sorting
  )
}

export function filterUserReportsByUrgency({
  reports = [],
  selectedUrgency = ALL_URGENCY_FILTER,
  allUrgencyFilter = ALL_URGENCY_FILTER,
  sorting = REPORT_SORTING_OPTIONS.LATEST_FIRST,
}) {
  if (selectedUrgency === allUrgencyFilter) {
    return sortReports(reports, sorting)
  }

  return sortReports(
    reports.filter((row) => String(row?.urgency || '') === String(selectedUrgency || '')),
    sorting
  )
}

export function buildVisiblePages({ currentPage, totalPages }) {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 2) {
    return [1, 2, 3]
  }

  if (currentPage >= totalPages - 1) {
    return [totalPages - 2, totalPages - 1, totalPages]
  }

  return [currentPage - 1, currentPage, currentPage + 1]
}

export function paginateReports({ rows = [], currentPage = 1, pageSize = 6 }) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const visibleRows = rows.slice(startIndex, startIndex + pageSize)
  const visiblePages = buildVisiblePages({
    currentPage: safeCurrentPage,
    totalPages,
  })

  return {
    totalPages,
    safeCurrentPage,
    visibleRows,
    visiblePages,
  }
}
