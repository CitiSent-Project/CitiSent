import { useEffect, useMemo, useState } from 'react'
import { SolidPieChart } from '../../components/Dashboard-Ui/Solid-Pie-Chart'
import { VerticalChart } from '../../components/Dashboard-Ui/Vertical-Chart'
import { DepartmentCardsGrid, Pagination, ReportsStatCards, UrgencyFeedTable, UrgencyFilterChips, EmotionFilterChips } from '../../components/Reports-Ui'
import { REPORT_EMOTION_OPTIONS } from '../../models/reportStatusModel'
import { canAdminUpdateReport, getScopedAgencyFilters } from '../../controllers/reports/reportAccessController'
import { filterUserReportsByCategory, buildWeeklyReportTrend } from '../../controllers/reports/userReportsController'
import { useReportPaginationState } from '../../hooks/reports/useReportPaginationState'
import { isSuperadmin } from '../../models/roleAccessModel'

const CATEGORY_COLORS = ['#1650e8', '#65c98d', '#8d66d6', '#ff9082', '#39bee0', '#ffb44d', '#2f89e5', '#7a6ce5', '#4f46e5']
const DAY_MS = 24 * 60 * 60 * 1000
const ALL_CATEGORY_FILTER_ID = 'all-categories'
const EMOTION_FILTER_CHIPS = ['All Emotions', ...REPORT_EMOTION_OPTIONS]

function normalizeAgencyOptions(options = []) {
  return options
    .map((option) => ({
      id: String(option?.id || '').trim(),
      label: String(option?.label || '').trim(),
      logoUrl: option?.logoUrl || null,
    }))
    .filter((option) => option.id && option.label)
}

function buildAgencyOptionsFromRows(rows = []) {
  const byId = new Map()

  rows.forEach((row) => {
    const id = String(row?.categoryId || '').trim()
    const label = String(row?.category || row?.issueType || '').trim()

    if (!id || !label || byId.has(id)) {
      return
    }

    byId.set(id, { id, label })
  })

  return Array.from(byId.values())
}

export function ByCategory({
  rows,
  allReports = [],
  weeklyTrendData,
  profile,
  reportsPerPage = 6,
  defaultSorting = 'Latest first',
  departmentOptions = [],
  onViewReport,
  onUpdateStatus,
  isLoading = false,
}) {
  const [selectedAgencyId, setSelectedAgencyId] = useState(ALL_CATEGORY_FILTER_ID)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('All Urgency')
  const [emotionFilter, setEmotionFilter] = useState('All Emotions')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const hasAllAccess = isSuperadmin(profile?.role)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchTerm])

  const categoryAgencyCards = useMemo(() => {
    const normalized = normalizeAgencyOptions(departmentOptions)
    if (normalized.length > 0) {
      return normalized
    }

    return buildAgencyOptionsFromRows(rows)
  }, [departmentOptions, rows])

  const cardsWithAllFilter = useMemo(() => {
    const scopedAgencies = getScopedAgencyFilters({ agencies: categoryAgencyCards, profile })
    if (hasAllAccess) {
      return [{ id: ALL_CATEGORY_FILTER_ID, label: 'All Departments', tone: 'bg-slate-100' }, ...scopedAgencies]
    }

    return scopedAgencies
  }, [categoryAgencyCards, hasAllAccess, profile])

  const effectiveSelectedAgencyId = cardsWithAllFilter.some((agency) => agency.id === selectedAgencyId)
    ? selectedAgencyId
    : cardsWithAllFilter[0]?.id || ALL_CATEGORY_FILTER_ID

  const filteredRows = useMemo(() => {
    let result = filterUserReportsByCategory({
      reports: rows,
      selectedCategoryId: effectiveSelectedAgencyId,
      hasAllAccess,
      allCategoryFilterId: ALL_CATEGORY_FILTER_ID,
      sorting: defaultSorting,
    })

    // Apply Search Filter
    if (debouncedSearchTerm) {
      const lowSearch = debouncedSearchTerm.toLowerCase()
      result = result.filter(r =>
        r.id?.toString().toLowerCase().includes(lowSearch) ||
        r.title?.toLowerCase().includes(lowSearch) ||
        r.userName?.toLowerCase().includes(lowSearch) ||
        r.issueType?.toLowerCase().includes(lowSearch)
      )
    }

    // Apply Status Filter
    if (statusFilter) {
      result = result.filter(r => r.status === statusFilter)
    }

    // Apply Urgency Filter
    if (urgencyFilter !== 'All Urgency') {
      result = result.filter(r => r.urgency === urgencyFilter)
    }

    // Apply Emotion Filter
    if (emotionFilter !== 'All Emotions') {
      result = result.filter(r => (r.emotionLevel || 'Neutral') === emotionFilter)
    }

    return result
  }, [
    defaultSorting,
    effectiveSelectedAgencyId,
    hasAllAccess,
    rows,
    debouncedSearchTerm,
    statusFilter,
    urgencyFilter,
    emotionFilter,
  ])

  // The label shown in the feed header badge.
  const selectedDepartmentLabel =
    cardsWithAllFilter.find((a) => a.id === effectiveSelectedAgencyId)?.label || 'All Departments'

  const urgencyChips = ['All Urgency', 'Critical', 'High', 'Medium', 'Low']
  const reportStats = useMemo(() => {
    const pendingCount = rows.filter((row) => row.status === 'Pending').length
    const inProgressCount = rows.filter((row) => row.status === 'In Progress').length

    return [
      {
        id: 'total-reports',
        label: 'Total Active Reports',
        value: String(rows.length),
        icon: 'folder',
        accent: 'green',
      },
      {
        id: 'pending-reports',
        label: 'Pending Review',
        value: String(pendingCount),
        icon: 'rejected',
        accent: 'amber',
      },
      {
        id: 'inprogress-reports',
        label: 'In Progress',
        value: String(inProgressCount),
        icon: 'inprogress',
        accent: 'blue',
      },
    ]
  }, [rows])
  const reportsByStatusData = useMemo(() => {
    const dataSource = allReports.length > 0 ? allReports : rows;
    const pendingCount = dataSource.filter((r) => r.status === 'Pending').length;
    const inProgressCount = dataSource.filter((r) => r.status === 'In Progress').length;
    const resolvedCount = dataSource.filter((r) => r.status === 'Resolved').length;
    const rejectedCount = dataSource.filter((r) => r.status === 'Rejected').length;

    const values = [pendingCount, inProgressCount, resolvedCount, rejectedCount];
    const labels = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
    // Amber, Blue, Emerald, Red
    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

    return {
      title: 'Report Status Breakdown',
      total: String(dataSource.length),
      labels,
      values,
      colors,
      legend: labels.map((label, index) => ({
        label,
        color: colors[index],
      })),
    };
  }, [allReports, rows]);

  const reportsThisWeekData = useMemo(() => {
    if (weeklyTrendData) return weeklyTrendData;
    return buildWeeklyReportTrend([])
  }, [weeklyTrendData])

  const {
    totalPages,
    safeCurrentPage,
    visibleRows,
    visiblePages,
    handlePageChange,
    handleNextPage,
    handlePreviousPage,
    resetToFirstPage,
  } = useReportPaginationState({ rows: filteredRows, pageSize: reportsPerPage })

  function handleSelectAgency(agencyId) {
    setSelectedAgencyId(agencyId)
    resetToFirstPage()
  }

  function handleSearchChange(value) {
    setSearchTerm(value)
    resetToFirstPage()
  }

  function handleStatusChange(value) {
    setStatusFilter(value)
    resetToFirstPage()
  }

  function handleUrgencyChange(value) {
    setUrgencyFilter(value)
    resetToFirstPage()
  }

  function handleEmotionChange(value) {
    setEmotionFilter(value)
    resetToFirstPage()
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 min-w-0 bg-[#eef2f8] px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:gap-5 w-full min-w-0">
        <header className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-300">!</span>
        </header>

        <section className="rounded-2xl bg-[#5f82bd] p-3 sm:p-4 md:p-6 w-full min-w-0 dark:bg-slate-800">
          <ReportsStatCards stats={reportStats} />
        </section>

        <section className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 w-full min-w-0">
          <div className="h-90 sm:h-100 lg:h-110 min-w-0">
            <SolidPieChart
              title={reportsByStatusData.title}
              total={reportsByStatusData.total}
              labels={reportsByStatusData.labels}
              values={reportsByStatusData.values}
              colors={reportsByStatusData.colors}
              legend={reportsByStatusData.legend}
            />
          </div>
          <div className="h-90 sm:h-100 lg:h-110 min-w-0">
            <VerticalChart
              title={reportsThisWeekData.title}
              labels={reportsThisWeekData.labels}
              values={reportsThisWeekData.values}
            />
          </div>
        </section>

        <DepartmentCardsGrid
          items={cardsWithAllFilter}
          selectedItemId={effectiveSelectedAgencyId}
          onSelectItem={handleSelectAgency}
        />

        <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm w-full min-w-0 dark:border-slate-700/80 dark:bg-slate-800">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Report Feed by Department</h2>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-cyan-900 dark:bg-blue-900/40 dark:text-cyan-200">
              {selectedDepartmentLabel}
            </span>
          </div>

          <div className="mb-4 px-1 flex flex-col gap-4">
            <UrgencyFilterChips
              chips={urgencyChips}
              selectedChip={urgencyFilter}
              onSelectChip={handleUrgencyChange}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              statusFilter={statusFilter}
              onStatusChange={handleStatusChange}
            />
            <EmotionFilterChips
              chips={EMOTION_FILTER_CHIPS}
              selectedChip={emotionFilter}
              onSelectChip={handleEmotionChange}
            />
          </div>

          <UrgencyFeedTable
            rows={visibleRows}
            onViewReport={onViewReport}
            onUpdateStatus={onUpdateStatus}
            canUpdateReport={(report) => canAdminUpdateReport({ profile, report })}
            isLoading={isLoading}
          />
        </section>

        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          visiblePages={visiblePages}
          onPageChange={handlePageChange}
          onNext={handleNextPage}
          onPrevious={handlePreviousPage}
        />
      </div>
    </main>
  )
}
