import { useMemo, useState } from 'react'
import { PieChart } from '../../components/Dashboard-Ui/Pie-Chart'
import { VerticalChart } from '../../components/Dashboard-Ui/Vertical-Chart'
import { AgencyCardsGrid, Pagination, ReportsStatCards, UrgencyFeedTable, UrgencyFilterChips } from '../../components/Reports-Ui'
import {
  allCategoryFilterId,
  categoryAgencyCards,
  reportsByCategoryData,
  reportsSummaryStats,
  reportsThisWeekData,
} from '../../models/data'
import { canAdminUpdateReport, getScopedAgencyFilters } from '../../controllers/reportAccessController'
import { filterUserReportsByCategory } from '../../controllers/userReportsController'
import { useReportPaginationState } from '../../hooks/useReportPaginationState'
import { isSuperadmin } from '../../models/roleAccessModel'

export function ByCategory({ rows, profile, onViewReport, onUpdateStatus }) {
  const [selectedAgencyId, setSelectedAgencyId] = useState(allCategoryFilterId)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('All Urgency')
  const hasAllAccess = isSuperadmin(profile?.role)

  const cardsWithAllFilter = useMemo(() => {
    const scopedAgencies = getScopedAgencyFilters({ agencies: categoryAgencyCards, profile })
    if (hasAllAccess) {
      return [{ id: allCategoryFilterId, label: 'All Agencies', tone: 'bg-slate-100' }, ...scopedAgencies]
    }

    return scopedAgencies
  }, [hasAllAccess, profile])

  const effectiveSelectedAgencyId = cardsWithAllFilter.some((agency) => agency.id === selectedAgencyId)
    ? selectedAgencyId
    : cardsWithAllFilter[0]?.id || allCategoryFilterId

  const filteredRows = useMemo(() => {
    let result = filterUserReportsByCategory({
      reports: rows,
      selectedCategoryId: effectiveSelectedAgencyId,
      hasAllAccess,
      allCategoryFilterId,
    })

    // Apply Search Filter
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase()
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

    return result
  }, [effectiveSelectedAgencyId, hasAllAccess, rows, searchTerm, statusFilter, urgencyFilter])

  const selectedAgencyLabel =
    cardsWithAllFilter.find((a) => a.id === effectiveSelectedAgencyId)?.label || 'All Agencies'

  const urgencyChips = ['All Urgency', 'Emergency', 'Urgent', 'Moderate', 'Calm']

  const {
    totalPages,
    safeCurrentPage,
    visibleRows,
    visiblePages,
    handlePageChange,
    handleNextPage,
    handlePreviousPage,
    resetToFirstPage,
  } = useReportPaginationState({ rows: filteredRows, pageSize: 6 })

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

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <header className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-slate-900">Reports</h1>
          <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 text-sm text-slate-700">!</span>
        </header>

        <section className="rounded-2xl bg-[#5f82bd] p-4 md:p-6">
          <ReportsStatCards stats={reportsSummaryStats} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_1.45fr]">
          <div className="min-h-110">
            <PieChart
              title={reportsByCategoryData.title}
              total={reportsByCategoryData.total}
              labels={reportsByCategoryData.labels}
              values={reportsByCategoryData.values}
              colors={reportsByCategoryData.colors}
              legend={reportsByCategoryData.legend}
            />
          </div>
          <div className="min-h-110">
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

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Report Feed by Agency</h2>
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
              {selectedAgencyLabel}
            </span>
          </div>

          <div className="mb-4 px-1">
            <UrgencyFilterChips
              chips={urgencyChips}
              selectedChip={urgencyFilter}
              onSelectChip={handleUrgencyChange}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              statusFilter={statusFilter}
              onStatusChange={handleStatusChange}
            />
          </div>

          <UrgencyFeedTable
            rows={visibleRows}
            onViewReport={onViewReport}
            onUpdateStatus={onUpdateStatus}
            canUpdateReport={(report) => canAdminUpdateReport({ profile, report })}
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
