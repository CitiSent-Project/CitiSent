import { useEffect, useMemo, useState } from 'react'
import { PieChart } from '../../components/Dashboard-Ui/Pie-Chart'
import { VerticalChart } from '../../components/Dashboard-Ui/Vertical-Chart'
import { AgencyCardsGrid, Pagination, ReportsStatCards, UrgencyFeedTable, UrgencyFilterChips, EmotionFilterChips } from '../../components/Reports-Ui'
import { REPORT_EMOTION_OPTIONS } from '../../models/reportStatusModel'
import { canAdminUpdateReport, getScopedAgencyFilters } from '../../controllers/reportAccessController'
import { filterUserReportsByCategory, buildWeeklyReportTrend } from '../../controllers/userReportsController'
import { useReportPaginationState } from '../../hooks/useReportPaginationState'
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
  profile,
  reportsPerPage = 6,
  defaultSorting = 'Latest first',
  departmentOptions = [],
  onViewReport,
  onUpdateStatus,
  onRefresh,
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
      return [{ id: ALL_CATEGORY_FILTER_ID, label: 'All Agencies', tone: 'bg-slate-100' }, ...scopedAgencies]
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

  const selectedAgencyLabel =
    cardsWithAllFilter.find((a) => a.id === effectiveSelectedAgencyId)?.label || 'All Agencies'

  const urgencyChips = ['All Urgency', 'Critical', 'High', 'Medium', 'Low']
  const reportStats = useMemo(() => {
    const resolvedCount = rows.filter((row) => row.status === 'Resolved').length
    const unresolvedCount = rows.length - resolvedCount

    return [
      {
        id: 'total-reports',
        label: 'Total Reports',
        value: String(rows.length),
        icon: 'folder',
        accent: 'green',
      },
      {
        id: 'resolved-reports',
        label: 'Reports Resolved',
        value: String(resolvedCount),
        icon: 'resolved',
        accent: 'amber',
      },
      {
        id: 'unresolved-reports',
        label: 'Unresolved Reports',
        value: String(unresolvedCount),
        icon: 'unresolved',
        accent: 'violet',
      },
    ]
  }, [rows])
  const reportsByCategoryData = useMemo(() => {
    const values = categoryAgencyCards.map(
      (agency) => rows.filter((row) => row.categoryId === agency.id).length
    )

    return {
      title: 'Total Reports Per Category',
      total: String(rows.length),
      labels: categoryAgencyCards.map((agency) => agency.label),
      values,
      colors: categoryAgencyCards.map((_, index) => CATEGORY_COLORS[index % CATEGORY_COLORS.length]),
      legend: categoryAgencyCards.map((agency, index) => ({
        label: agency.label,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      })),
    }
  }, [categoryAgencyCards, rows])
  const reportsThisWeekData = useMemo(() => buildWeeklyReportTrend(rows), [rows])

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
    <main className="mx-auto w-full max-w-7xl flex-1 min-w-0 bg-[#eef2f8] px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:gap-5 w-full min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">Reports</h1>
            <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 text-sm text-slate-700">!</span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </header>

        <section className="rounded-2xl bg-[#5f82bd] p-3 sm:p-4 md:p-6 w-full min-w-0">
          <ReportsStatCards stats={reportStats} />
        </section>

        <section className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-[1fr_1.45fr] w-full min-w-0">
          <div className="min-w-0 w-full min-h-90 sm:min-h-100">
            <PieChart
              title={reportsByCategoryData.title}
              total={reportsByCategoryData.total}
              labels={reportsByCategoryData.labels}
              values={reportsByCategoryData.values}
              colors={reportsByCategoryData.colors}
              legend={reportsByCategoryData.legend}
            />
          </div>
          <div className="min-w-0 w-full min-h-90 sm:min-h-100">
            <VerticalChart
              title={reportsThisWeekData.title}
              labels={reportsThisWeekData.labels}
              values={reportsThisWeekData.values}
            />
          </div>
        </section>

        <AgencyCardsGrid
          items={cardsWithAllFilter}
          selectedItemId={effectiveSelectedAgencyId}
          onSelectItem={handleSelectAgency}
        />

        <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm w-full min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Report Feed by Agency</h2>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-cyan-900">
              {selectedAgencyLabel}
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
