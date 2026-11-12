import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  FiStar,
  FiThumbsUp,
  FiThumbsDown,
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiDownload,
  FiGrid,
  FiMessageSquare,
  FiAlertCircle,
} from 'react-icons/fi'
import { reportsApiService } from '../../services/api/admin/reportsApiService'
import { loadFromStorageWithSchema } from '../../services/storageService'
import { ADMIN_STORAGE_KEYS } from '../../models/data'
import { getStorageSchemaRule } from '../../models/storageSchemaModel'
import { Pagination } from '../../components/ui/Pagination'
import { useReportPaginationState } from '../../hooks/reports/useReportPaginationState'

function formatReportId(reportNum, id) {
  const value = String(reportNum || id || '').trim()
  if (!value) return 'N/A'
  return value.length > 14 ? `${value.slice(0, 10)}…` : value
}

function formatDateTimeLabel(value) {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ResidentFeedback({
  rows = [],
  departmentOptions = [],
  onViewReport,
  isLoading: isParentLoading = false,
}) {
  const [feedbackItems, setFeedbackItems] = useState([])
  const [serverStats, setServerStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [satisfactionFilter, setSatisfactionFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('All')

  const loadFeedback = useCallback(async () => {
    const schemaRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.accessToken)
    const token = loadFromStorageWithSchema(
      ADMIN_STORAGE_KEYS.accessToken,
      '',
      {
        schemaVersion: schemaRule.schemaVersion,
        migrate: schemaRule.migrate,
        validate: schemaRule.validate,
      },
    )
    if (!token) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await reportsApiService.listFeedback(token, {
        limit: 500,
        offset: 0,
      })
      const items = Array.isArray(response?.data) ? response.data : []
      setFeedbackItems(items)
      if (response?.stats) {
        setServerStats(response.stats)
      }
    } catch (err) {
      setErrorMessage(
        err?.message || 'Unable to load resident feedback from the server.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeedback()
  }, [loadFeedback])

  // Merge server feedback items with any resolved rows from parent state as fallback
  const mergedFeedbackRows = useMemo(() => {
    const reportsById = new Map()
    rows.forEach((row) => {
      if (row?.id) {
        reportsById.set(String(row.id), row)
      }
    })

    if (feedbackItems.length > 0) {
      return feedbackItems.map((item) => {
        const matchingReport = reportsById.get(String(item.reportId || '')) || null
        return {
          id: item.id || `${item.reportId}-feedback`,
          reportId: item.reportId,
          reportNumber:
            item.reportNumber ||
            matchingReport?.reportNum ||
            matchingReport?.reportNumber ||
            item.reportId,
          rating: Number(item.rating || 0),
          isSatisfied:
            typeof item.isSatisfied === 'boolean' ? item.isSatisfied : null,
          comment: String(item.comment ?? '').trim(),
          createdAt: item.createdAt || item.updatedAt || null,
          departmentLabel:
            item.departmentLabel ||
            matchingReport?.category ||
            item.issueType ||
            'Unassigned',
          issueType: item.issueType || matchingReport?.issueType || '',
          location: item.location || matchingReport?.location || 'Sto. Tomas, Batangas',
          description: item.description || matchingReport?.message || '',
          urgency: item.urgency || matchingReport?.urgency || 'Low',
          resolvedAt: item.resolvedAt || matchingReport?.resolvedAt || null,
          reporterName:
            item.reporter?.fullName ||
            matchingReport?.name ||
            'Resident',
          reporterEmail:
            item.reporter?.email ||
            matchingReport?.email ||
            'Anonymous',
          matchingReport,
        }
      })
    }

    // Fallback: derive from rows that already have feedback attached
    return rows
      .filter((row) => row?.feedback && Number(row.feedback.rating) >= 1)
      .map((row) => ({
        id: row.feedback.id || `${row.id}-feedback`,
        reportId: row.id,
        reportNumber: row.reportNum || row.reportNumber || row.id,
        rating: Number(row.feedback.rating),
        isSatisfied:
          typeof row.feedback.isSatisfied === 'boolean'
            ? row.feedback.isSatisfied
            : null,
        comment: String(row.feedback.comment ?? '').trim(),
        createdAt: row.feedback.createdAt || row.resolvedAt || row.updatedAt,
        departmentLabel: row.category || row.issueType || 'Unassigned',
        issueType: row.issueType || row.category || '',
        location: row.location || 'Sto. Tomas, Batangas',
        description: row.message || '',
        urgency: row.urgency || 'Low',
        resolvedAt: row.resolvedAt || null,
        reporterName: row.name || 'Resident',
        reporterEmail: row.email || 'Anonymous',
        matchingReport: row,
      }))
  }, [feedbackItems, rows])

  // Available departments for filtering
  const availableDepartments = useMemo(() => {
    const list = new Set()
    departmentOptions.forEach((dept) => {
      const label = dept?.label || dept?.name || dept
      if (label) list.add(String(label).trim())
    })
    mergedFeedbackRows.forEach((item) => {
      if (item.departmentLabel) list.add(String(item.departmentLabel).trim())
    })
    return ['All Departments', ...Array.from(list)]
  }, [departmentOptions, mergedFeedbackRows])

  // Filtered feedback rows
  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return mergedFeedbackRows
      .filter((item) => {
        if (
          departmentFilter !== 'All' &&
          departmentFilter !== 'All Departments'
        ) {
          if (item.departmentLabel !== departmentFilter) {
            return false
          }
        }

        if (ratingFilter !== 'all') {
          if (Number(item.rating) !== Number(ratingFilter)) {
            return false
          }
        }

        if (satisfactionFilter === 'satisfied' && item.isSatisfied !== true) {
          return false
        }
        if (satisfactionFilter === 'unsatisfied' && item.isSatisfied !== false) {
          return false
        }
        if (satisfactionFilter === 'unanswered' && item.isSatisfied !== null) {
          return false
        }

        if (normalizedSearch) {
          const haystack = [
            item.reportNumber,
            item.reportId,
            item.comment,
            item.departmentLabel,
            item.location,
            item.reporterName,
            item.reporterEmail,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          if (!haystack.includes(normalizedSearch)) {
            return false
          }
        }

        return true
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
  }, [
    mergedFeedbackRows,
    departmentFilter,
    ratingFilter,
    satisfactionFilter,
    searchTerm,
  ])

  // Compute statistics fromdepartment-scoped rows (or serverStats)
  const computedStats = useMemo(() => {
    const baseItems =
      departmentFilter !== 'All' && departmentFilter !== 'All Departments'
        ? mergedFeedbackRows.filter(
            (item) => item.departmentLabel === departmentFilter,
          )
        : mergedFeedbackRows

    const totalFeedback = baseItems.length
    const resolvedReportsCount =
      departmentFilter !== 'All' && departmentFilter !== 'All Departments'
        ? rows.filter(
            (r) =>
              r.status === 'Resolved' &&
              (r.category === departmentFilter ||
                r.issueType === departmentFilter),
          ).length
        : serverStats?.totalResolvedReports ??
          rows.filter((r) => r.status === 'Resolved').length

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let ratingSum = 0
    let satisfiedCount = 0
    let unsatisfiedCount = 0

    baseItems.forEach((item) => {
      const r = Number(item.rating)
      if (r >= 1 && r <= 5) {
        distribution[r] = (distribution[r] || 0) + 1
        ratingSum += r
      }
      if (item.isSatisfied === true) satisfiedCount += 1
      if (item.isSatisfied === false) unsatisfiedCount += 1
    })

    const averageRating =
      totalFeedback > 0 ? Number((ratingSum / totalFeedback).toFixed(2)) : 0
    const answeredTotal = satisfiedCount + unsatisfiedCount
    const satisfactionRate =
      answeredTotal > 0
        ? Number(((satisfiedCount / answeredTotal) * 100).toFixed(1))
        : totalFeedback > 0
          ? Number(
              (
                (baseItems.filter((i) => i.rating >= 4).length /
                  totalFeedback) *
                100
              ).toFixed(1),
            )
          : 0
    const responseRate =
      resolvedReportsCount > 0
        ? Number(((totalFeedback / resolvedReportsCount) * 100).toFixed(1))
        : 0

    return {
      totalFeedback,
      totalResolvedReports: resolvedReportsCount,
      responseRate,
      averageRating,
      satisfiedCount,
      unsatisfiedCount,
      satisfactionRate,
      ratingDistribution: distribution,
    }
  }, [mergedFeedbackRows, departmentFilter, rows, serverStats])

  const {
    totalPages,
    safeCurrentPage,
    visibleRows,
    visiblePages,
    handlePageChange,
    handleNextPage,
    handlePreviousPage,
  } = useReportPaginationState({ rows: filteredRows, pageSize: 8 })

  const handleOpenReportDetail = (item) => {
    if (!onViewReport) return
    if (item.matchingReport) {
      onViewReport(item.matchingReport)
      return
    }

    onViewReport({
      id: item.reportId,
      reportNum: item.reportNumber,
      reportNumber: item.reportNumber,
      category: item.departmentLabel,
      issueType: item.issueType || item.departmentLabel,
      location: item.location,
      message: item.description,
      urgency: item.urgency || 'Low',
      status: 'Resolved',
      date: formatDateTimeLabel(item.resolvedAt || item.createdAt),
      resolvedAt: item.resolvedAt,
      name: item.reporterName,
      email: item.reporterEmail,
      feedback: {
        id: item.id,
        reportId: item.reportId,
        rating: item.rating,
        isSatisfied: item.isSatisfied,
        comment: item.comment,
        createdAt: item.createdAt,
      },
    })
  }

  const exportFeedbackToCSV = () => {
    if (filteredRows.length === 0) return

    const headers = [
      'Report ID',
      'Department',
      'Resident Email',
      'Star Rating (1-5)',
      'Satisfaction',
      'Resident Comment',
      'Location',
      'Submitted At',
    ]
    const csvLines = [headers.join(',')]

    filteredRows.forEach((item) => {
      const satisfactionLabel =
        item.isSatisfied === true
          ? 'Satisfied'
          : item.isSatisfied === false
            ? 'Not Satisfied'
            : 'Not Specified'
      const escapedComment = String(item.comment || '').replace(/"/g, '""')
      const line = [
        `"${item.reportNumber || item.reportId}"`,
        `"${item.departmentLabel || ''}"`,
        `"${item.reporterEmail || 'Anonymous'}"`,
        `"${item.rating}"`,
        `"${satisfactionLabel}"`,
        `"${escapedComment}"`,
        `"${item.location || ''}"`,
        `"${formatDateTimeLabel(item.createdAt)}"`,
      ]
      csvLines.push(line.join(','))
    })

    const blob = new Blob([csvLines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'Sto_Tomas_Resident_Feedback.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const showSkeleton = (isLoading || isParentLoading) && mergedFeedbackRows.length === 0

  return (
    <main className="w-full flex-1 min-w-0 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8 dark:bg-slate-900">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Resident Feedback on Solutions
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                <FiStar className="fill-amber-400 text-amber-500 text-xs" />
                Service Evaluation
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Monitor citizen ratings, satisfaction levels, and written reviews for resolved community reports.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadFeedback}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <FiRefreshCw className={`text-xs ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              type="button"
              onClick={exportFeedbackToCSV}
              disabled={filteredRows.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FiDownload className="text-xs" />
              Export CSV
            </button>
          </div>
        </header>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="text-sm shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={loadFeedback}
              className="rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Overview Statistics Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Card 1: Average Star Rating */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-800/90">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Average Rating
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400">
                <FiStar className="fill-current text-lg" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-numeric text-3xl font-extrabold text-slate-900 dark:text-white">
                {computedStats.averageRating.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                / 5.0
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`text-sm ${
                    star <= Math.round(computedStats.averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200 dark:text-slate-700'
                  }`}
                />
              ))}
              <span className="ml-1.5 text-xs text-slate-500 dark:text-slate-400">
                ({computedStats.totalFeedback} review{computedStats.totalFeedback === 1 ? '' : 's'})
              </span>
            </div>
          </div>

          {/* Card 2: Resident Satisfaction Rate */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-800/90">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Resident Satisfaction
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <FiThumbsUp className="text-lg" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-numeric text-3xl font-extrabold text-slate-900 dark:text-white">
                {computedStats.satisfactionRate}%
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                positive
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                <FiThumbsUp className="text-[11px]" />
                {computedStats.satisfiedCount} Satisfied
              </span>
              <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                <FiThumbsDown className="text-[11px]" />
                {computedStats.unsatisfiedCount} Unsatisfied
              </span>
            </div>
          </div>

          {/* Card 3: Total Feedback & Response Rate */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-800/90">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Feedback Received
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <FiMessageSquare className="text-lg" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-numeric text-3xl font-extrabold text-slate-900 dark:text-white">
                {computedStats.totalFeedback}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                of {computedStats.totalResolvedReports} resolved reports
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Response rate:{' '}
              <span className="font-numeric font-semibold text-slate-700 dark:text-slate-200">
                {computedStats.responseRate}%
              </span>
            </p>
          </div>

          {/* Card 4: 1–5 Star Rating Breakdown */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-800/90">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rating Breakdown
            </span>
            <div className="mt-2 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = computedStats.ratingDistribution?.[star] || 0
                const pct =
                  computedStats.totalFeedback > 0
                    ? Math.round((count / computedStats.totalFeedback) * 100)
                    : 0
                return (
                  <div key={star} className="flex items-center gap-2 text-[11px]">
                    <span className="w-7 font-numeric font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-0.5">
                      {star}
                      <FiStar className="fill-amber-400 text-amber-400 text-[10px]" />
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-numeric text-slate-500 dark:text-slate-400">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2.5 w-full">
            {/* Search Input */}
            <div className="flex flex-1 sm:flex-initial sm:w-72 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600/30 transition-colors dark:border-slate-800 dark:bg-slate-900">
              <FiSearch className="text-slate-400 shrink-0 dark:text-slate-500 text-xs" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Report #, comment, email, or location..."
                aria-label="Search feedback"
                className="w-full bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none min-w-0 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Star Rating Filter Group */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs font-medium dark:border-slate-800 dark:bg-slate-900">
              {['all', '5', '4', '3', '2', '1'].map((starOpt) => {
                const active = String(ratingFilter) === starOpt
                return (
                  <button
                    key={starOpt}
                    type="button"
                    onClick={() => setRatingFilter(starOpt)}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {starOpt === 'all' ? (
                      'All Stars'
                    ) : (
                      <>
                        <span>{starOpt}</span>
                        <FiStar
                          className={`text-[10px] ${
                            active ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'
                          }`}
                        />
                      </>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Satisfaction Filter */}
            <select
              aria-label="Filter by resident satisfaction"
              value={satisfactionFilter}
              onChange={(e) => setSatisfactionFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="all">Satisfaction: All</option>
              <option value="satisfied">Satisfied Only</option>
              <option value="unsatisfied">Not Satisfied Only</option>
              <option value="unanswered">No Satisfaction Answer</option>
            </select>

            {/* Department Filter */}
            <div className="relative flex items-center">
              <FiGrid className="pointer-events-none absolute left-2.5 text-xs text-blue-500 z-10" />
              <select
                aria-label="Filter feedback by department"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-6 text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === 'All Departments' ? 'Department: All' : dept}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 text-[9px] text-slate-400">
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Feedback Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="px-4 py-3 w-32">Report #</th>
                <th className="px-4 py-3">Department & Location</th>
                <th className="px-4 py-3 w-36">Star Rating</th>
                <th className="px-4 py-3 w-36">Satisfaction</th>
                <th className="px-4 py-3">Resident Comment</th>
                <th className="px-4 py-3 w-44">Resident & Date</th>
                <th className="px-4 py-3 text-right w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              {showSkeleton ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/60">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500"
                  >
                    No resident feedback records match the selected filters.
                  </td>
                </tr>
              ) : (
                visibleRows.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 align-top font-numeric">
                      <span
                        className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        title={item.reportNumber || item.reportId}
                      >
                        {formatReportId(item.reportNumber, item.reportId)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.departmentLabel}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 truncate max-w-xs dark:text-slate-400">
                        {item.location}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className={`text-xs ${
                              star <= item.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200 dark:text-slate-700'
                            }`}
                          />
                        ))}
                        <span className="ml-1 font-numeric font-bold text-slate-800 dark:text-slate-200">
                          {item.rating}/5
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {item.isSatisfied === true ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
                          <FiThumbsUp className="text-[10px]" />
                          Satisfied
                        </span>
                      ) : item.isSatisfied === false ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800">
                          <FiThumbsDown className="text-[10px]" />
                          Unsatisfied
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          Not specified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top max-w-md">
                      {item.comment ? (
                        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 line-clamp-3">
                          &ldquo;{item.comment}&rdquo;
                        </p>
                      ) : (
                        <span className="italic text-slate-400 dark:text-slate-500">
                          No written comment
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                        {item.reporterEmail || item.reporterName}
                      </p>
                      <p className="mt-0.5 font-numeric text-[11px] text-slate-400 dark:text-slate-500">
                        {formatDateTimeLabel(item.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenReportDetail(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <FiEye className="text-xs" />
                        Report
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards */}
        <div className="block md:hidden space-y-3">
          {showSkeleton ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800"
              />
            ))
          ) : visibleRows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
              No resident feedback records match the selected filters.
            </div>
          ) : (
            visibleRows.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      {formatReportId(item.reportNumber, item.reportId)}
                    </span>
                    <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                      {item.departmentLabel}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.location}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      <FiStar className="fill-amber-400 text-amber-400 text-xs" />
                      {item.rating} / 5
                    </div>
                    {typeof item.isSatisfied === 'boolean' && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          item.isSatisfied
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                        }`}
                      >
                        {item.isSatisfied ? 'Satisfied' : 'Unsatisfied'}
                      </span>
                    )}
                  </div>
                </div>

                {item.comment && (
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                    &ldquo;{item.comment}&rdquo;
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/60">
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    <p className="font-medium text-slate-600 dark:text-slate-300">
                      {item.reporterEmail || item.reporterName}
                    </p>
                    <p className="font-numeric">{formatDateTimeLabel(item.createdAt)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenReportDetail(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <FiEye className="text-xs" />
                    View Report
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pt-2">
            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              visiblePages={visiblePages}
              onPageChange={handlePageChange}
              onNext={handleNextPage}
              onPrevious={handlePreviousPage}
            />
          </div>
        )}
      </div>
    </main>
  )
}
