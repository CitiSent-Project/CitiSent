import { useMemo, useState } from 'react'
import { PieChart } from '../../components/Dashboard-Ui/Pie-Chart'
import { VerticalChart } from '../../components/Dashboard-Ui/Vertical-Chart'
import { AgencyCardsGrid, Pagination, ReportsStatCards, UrgencyFeedTable } from '../../components/Reports-Ui'
import {
  allCategoryFilterId,
  categoryAgencyCards,
  reportsByCategoryData,
  reportsSummaryStats,
  reportsThisWeekData,
} from '../Data/reportsData'

export function ByCategory({ rows, onViewReport, onUpdateStatus }) {
  const pageSize = 6
  const [selectedAgencyId, setSelectedAgencyId] = useState(allCategoryFilterId)
  const [currentPage, setCurrentPage] = useState(1)

  const cardsWithAllFilter = useMemo(
    () => [
      { id: allCategoryFilterId, label: 'All Agencies', tone: 'bg-slate-100' },
      ...categoryAgencyCards,
    ],
    []
  )

  const filteredRows = useMemo(() => {
    const filtered =
      selectedAgencyId === allCategoryFilterId
        ? rows
        : rows.filter((row) => row.categoryId === selectedAgencyId)

    return [...filtered].sort((a, b) => b.dateValue - a.dateValue)
  }, [selectedAgencyId, rows])

  const selectedAgencyLabel =
    cardsWithAllFilter.find((a) => a.id === selectedAgencyId)?.label || 'All Agencies'

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const visibleRows = filteredRows.slice(startIndex, startIndex + pageSize)

  const visiblePages = useMemo(() => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (safeCurrentPage <= 2) return [1, 2, 3]
    if (safeCurrentPage >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages]
    return [safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1]
  }, [safeCurrentPage, totalPages])

  function handleSelectAgency(agencyId) {
    setSelectedAgencyId(agencyId)
    setCurrentPage(1)
  }

  function handlePageChange(page) { setCurrentPage(page) }
  function handleNextPage() { setCurrentPage((p) => Math.min(p + 1, totalPages)) }
  function handlePreviousPage() { setCurrentPage((p) => Math.max(p - 1, 1)) }

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
          selectedItemId={selectedAgencyId}
          onSelectItem={handleSelectAgency}
        />

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">Report Feed by Agency</h2>
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
              {selectedAgencyLabel}
            </span>
          </div>
          <UrgencyFeedTable
            rows={visibleRows}
            onViewReport={onViewReport}
            onUpdateStatus={onUpdateStatus}
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
