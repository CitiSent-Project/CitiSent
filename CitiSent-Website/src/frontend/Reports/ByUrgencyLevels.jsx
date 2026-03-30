import { useMemo, useState } from 'react'
import { VerticalChart } from '../../components/Dashboard-Ui/Vertical-Chart'
import {
  Pagination,
  ReportsStatCards,
  UrgencyDoughnutChart,
  UrgencyFeedTable,
  UrgencyFilterChips,
} from '../../components/Reports-Ui'
import { canAdminUpdateReport } from '../../controllers/reportAccessController'
import {
  ALL_URGENCY_FILTER,
  filterUserReportsByUrgency,
} from '../../controllers/userReportsController'
import { useReportPaginationState } from '../../hooks/useReportPaginationState'

const URGENCY_COLORS = ['#1e3a8a', '#1d4ed8', '#3b82f6', '#93c5fd']
const WEEK_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const URGENCY_FILTER_CHIPS = ['All Reports', 'Emergency', 'Urgent', 'Moderate', 'Calm']

export function ByUrgencyLevels({
  rows,
  profile,
  onViewReport,
  onUpdateStatus,
  isLoading = false,
}) {
  const [selectedUrgency, setSelectedUrgency] = useState(URGENCY_FILTER_CHIPS[0])

  const filteredRows = useMemo(() => {
    return filterUserReportsByUrgency({
      reports: rows,
      selectedUrgency,
      allUrgencyFilter: ALL_URGENCY_FILTER,
    })
  }, [selectedUrgency, rows])

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

  function handleSelectUrgency(chip) {
    setSelectedUrgency(chip)
    resetToFirstPage()
  }

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

  const urgencyLevelsData = useMemo(() => {
    const labels = ['Emergency', 'Urgent', 'Moderate', 'Calm']
    const values = labels.map(
      (label) => rows.filter((row) => row.urgency === label).length
    )

    return {
      title: 'Reports By Urgency Levels',
      total: String(rows.length),
      labels,
      values,
      colors: URGENCY_COLORS,
      legend: labels.map((label, index) => ({
        label,
        color: URGENCY_COLORS[index],
      })),
    }
  }, [rows])

  const reportsThisWeekData = useMemo(() => {
    const values = WEEK_LABELS.map(() => 0)

    rows.forEach((row) => {
      const parsedDate = new Date(row.createdAt || row.dateValue || 0)
      const dayIndex = parsedDate.getDay()
      if (!Number.isNaN(dayIndex)) {
        values[dayIndex] += 1
      }
    })

    return {
      title: 'Total Reports This Week',
      labels: WEEK_LABELS,
      values,
    }
  }, [rows])

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <header className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-slate-900">Reports</h1>
          <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 text-sm text-slate-700">!</span>
        </header>

        <section className="rounded-2xl bg-[#5f82bd] p-4 md:p-6">
          <ReportsStatCards stats={reportStats} />
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
          chips={URGENCY_FILTER_CHIPS}
          selectedChip={selectedUrgency}
          onSelectChip={handleSelectUrgency}
        />
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
            Loading reports...
          </div>
        ) : null}
        <UrgencyFeedTable
          rows={isLoading ? [] : visibleRows}
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
