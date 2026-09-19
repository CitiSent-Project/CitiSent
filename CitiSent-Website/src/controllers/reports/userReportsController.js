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
    const reportNumber = report.reportNumber || report.reportNum || report.id
    const user = usersById[report.userId] || {}
    const fullName = `${user.firstName || 'Unknown'} ${user.lastName || 'User'}`.trim()
    const createdAt = Date.parse(report.createdAt)
    const safeCreatedAt = Number.isNaN(createdAt) ? Date.now() : createdAt

    return {
      id: report.id || `UR-${String(reportNumber)}`,
      reportNum: reportNumber,
      reportNumber,
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

const DAY_MS = 24 * 60 * 60 * 1000

export function buildWeeklyReportTrend(rows = []) {
  const now = Date.now()
  const points = []
  const countsByDateKey = {}
  for (let offset = 6; offset >= 0; offset -= 1) {
    const pointTime = now - offset * DAY_MS
    const d = new Date(pointTime)
    const dateKey = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { weekday: 'long' })
    countsByDateKey[dateKey] = 0
    points.push({ dateKey, label })
  }

  const sevenDaysAgo = now - 7 * DAY_MS
  rows.forEach((row) => {
    const ts = row.dateValue || Date.parse(row.createdAt || '')
    if (Number.isNaN(ts) || ts < sevenDaysAgo) return
    const dateKey = new Date(ts).toISOString().slice(0, 10)
    if (countsByDateKey[dateKey] !== undefined) {
      countsByDateKey[dateKey] += 1
    }
  })

  return {
    title: 'Total Reports This Week',
    labels: points.map((p) => p.label),
    values: points.map((p) => countsByDateKey[p.dateKey]),
  }
}

export function getReportSearchableDateStrings(report = {}) {
  const dateStrings = new Set()

  if (report.date) {
    dateStrings.add(String(report.date).trim())
  }
  if (report.createdAt) {
    dateStrings.add(String(report.createdAt).trim())
  }
  if (report.resolvedAt) {
    dateStrings.add(String(report.resolvedAt).trim())
  }
  if (report.updatedAt) {
    dateStrings.add(String(report.updatedAt).trim())
  }

  const candidates = [
    report.dateValue,
    report.createdAt,
    report.resolvedAt,
    report.updatedAt,
    report.date,
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    const dateObj = candidate instanceof Date ? candidate : new Date(candidate)
    if (!Number.isNaN(dateObj.getTime())) {
      // "Sep 17, 2026"
      dateStrings.add(
        dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      )
      // "September 17, 2026"
      dateStrings.add(
        dateObj.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      )
      // "09/17/2026"
      dateStrings.add(
        dateObj.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
        })
      )
      // "9/17/2026"
      dateStrings.add(
        dateObj.toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
        })
      )
      // "2026-09-17"
      try {
        const isoDate = dateObj.toISOString().slice(0, 10)
        dateStrings.add(isoDate)
        dateStrings.add(isoDate.replace(/-/g, '/'))
      } catch {
        // ignore Date bounds / ISO conversion errors
      }
    }
  }

  return Array.from(dateStrings)
}

export function matchesReportSearch(report = {}, searchTerm = '') {
  const query = String(searchTerm || '').trim().toLowerCase()
  if (!query) {
    return true
  }

  // 1. Email Address of the user
  const email = String(
    report.email ||
    report.userEmail ||
    report.reporter?.email ||
    ''
  ).toLowerCase()
  if (email.includes(query)) {
    return true
  }

  // 2. Report ID (internal id, reportNum, reportNumber)
  const id = String(report.id || '').toLowerCase()
  const reportNum = String(report.reportNum || '').toLowerCase()
  const reportNumber = String(report.reportNumber || '').toLowerCase()
  if (id.includes(query) || reportNum.includes(query) || reportNumber.includes(query)) {
    return true
  }

  // 3. Location of the report
  const location = String(
    report.location ||
    report.reportLocation ||
    ''
  ).toLowerCase()
  if (location.includes(query)) {
    return true
  }

  // 4. Date of the report
  const dateStrings = getReportSearchableDateStrings(report)
  if (dateStrings.some((dStr) => dStr.toLowerCase().includes(query))) {
    return true
  }

  // Supplementary fields: Name, Category/IssueType, Message
  const name = String(report.name || report.userName || '').toLowerCase()
  if (name.includes(query)) {
    return true
  }

  const category = String(
    report.category ||
    report.issueType ||
    report.title ||
    ''
  ).toLowerCase()
  if (category.includes(query)) {
    return true
  }

  const message = String(report.message || report.reportDescription || '').toLowerCase()
  if (message.includes(query)) {
    return true
  }

  return false
}

export function filterReportsBySearch(reports = [], searchTerm = '') {
  if (!String(searchTerm || '').trim()) {
    return reports
  }

  return reports.filter((report) => matchesReportSearch(report, searchTerm))
}

