import { useMemo, useState } from 'react'
import { VerticalChart } from '../../components/Dashboard-Ui/Vertical-Chart'
import {
  Pagination,
  ReportsStatCards,
  UrgencyDoughnutChart,
  UrgencyFeedTable,
  UrgencyFilterChips,
} from '../../components/Reports-Ui'
import {
  reportsSummaryStats,
  reportsThisWeekData,
  urgencyFilterChips,
  urgencyLevelsData,
} from '../Data/reportsData'
import { canAdminUpdateReport } from '../../controllers/reportAccessController'

export function ByUrgencyLevels({ rows, profile, onViewReport, onUpdateStatus }) {
  const pageSize = 6
  const [selectedUrgency, setSelectedUrgency] = useState(urgencyFilterChips[0])
  const [currentPage, setCurrentPage] = useState(1)

  const filteredRows = useMemo(() => {
    const filtered =
      selectedUrgency === 'All Reports'
        ? rows
        : rows.filter((row) => row.urgency === selectedUrgency)

    return [...filtered].sort((a, b) => b.dateValue - a.dateValue)
  }, [selectedUrgency, rows])

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

  function handleSelectUrgency(chip) { setSelectedUrgency(chip); setCurrentPage(1) }
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
          <UrgencyDoughnutChart
            title={urgencyLevelsData.title}
            total={urgencyLevelsData.total}
            labels={urgencyLevelsData.labels}
            values={urgencyLevelsData.values}
            colors={urgencyLevelsData.colors}
            legend={urgencyLevelsData.legend}
          />
          <div className="min-h-110">
            <VerticalChart
              title={reportsThisWeekData.title}
              labels={reportsThisWeekData.labels}
              values={reportsThisWeekData.values}
            />
          </div>
        </section>

        <UrgencyFilterChips
          chips={urgencyFilterChips}
          selectedChip={selectedUrgency}
          onSelectChip={handleSelectUrgency}
        />
        <UrgencyFeedTable
          rows={visibleRows}
          onViewReport={onViewReport}
          onUpdateStatus={onUpdateStatus}
          canUpdateReport={(report) => canAdminUpdateReport({ profile, report })}
        />
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
