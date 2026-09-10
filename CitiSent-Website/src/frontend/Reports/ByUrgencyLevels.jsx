import { useEffect, useMemo, useState } from 'react'
import { SolidPieChart } from '../../components/Dashboard-Ui/Solid-Pie-Chart'
import { VerticalChart } from '../../components/Dashboard-Ui/Vertical-Chart'
import {
  Pagination,
  ReportsStatCards,
  UrgencyDoughnutChart,
  UrgencyFeedTable,
  UrgencyFilterChips,
  EmotionFilterChips,
} from '../../components/Reports-Ui'
import { REPORT_EMOTION_OPTIONS } from '../../models/reportStatusModel'
import { canAdminUpdateReport } from '../../controllers/reports/reportAccessController'
import {
  ALL_URGENCY_FILTER,
  filterUserReportsByUrgency,
  buildWeeklyReportTrend,
} from '../../controllers/reports/userReportsController'
import { useReportPaginationState } from '../../hooks/reports/useReportPaginationState'

const URGENCY_COLORS = ['#ef4444', '#f97316', '#eab308', '#10b981']
const DAY_MS = 24 * 60 * 60 * 1000
const URGENCY_FILTER_CHIPS = ['All Reports', 'Critical', 'High', 'Medium', 'Low']
const EMOTION_FILTER_CHIPS = ['All Emotions', ...REPORT_EMOTION_OPTIONS]

export function ByUrgencyLevels({
  rows,
  allReports = [],
  weeklyTrendData,
  profile,
  reportsPerPage = 6,
  defaultSorting = 'Latest first',
  onViewReport,
  onUpdateStatus,
  isLoading = false,
}) {
  const [selectedUrgency, setSelectedUrgency] = useState(URGENCY_FILTER_CHIPS[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [emotionFilter, setEmotionFilter] = useState('All Emotions')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchTerm])

  const filteredRows = useMemo(() => {
    // Start with urgency-filtered set then apply search + status filters
    let result = filterUserReportsByUrgency({
      reports: rows,
      selectedUrgency,
      allUrgencyFilter: ALL_URGENCY_FILTER,
      sorting: defaultSorting,
    })

    // Apply search filtering
    if (debouncedSearchTerm) {
      const low = debouncedSearchTerm.toLowerCase()
      result = result.filter((r) =>
        String(r.id || '')?.toLowerCase().includes(low) ||
        String(r.title || '')?.toLowerCase().includes(low) ||
        String(r.userName || '')?.toLowerCase().includes(low) ||
        String(r.issueType || '')?.toLowerCase().includes(low),
      )
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter)
    }

    // Apply emotion filter
    if (emotionFilter !== 'All Emotions') {
      result = result.filter((r) => (r.emotionLevel || 'Neutral') === emotionFilter)
    }

    return result
  }, [defaultSorting, selectedUrgency, rows, debouncedSearchTerm, statusFilter, emotionFilter])

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

  function handleSelectUrgency(chip) {
    setSelectedUrgency(chip)
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

  function handleEmotionChange(value) {
    setEmotionFilter(value)
    resetToFirstPage()
  }

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

        <section className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-[1fr_1.45fr] w-full min-w-0">
          <div className="min-w-0 w-full min-h-90 sm:min-h-100">
            <SolidPieChart
              title={reportsByStatusData.title}
              total={reportsByStatusData.total}
              labels={reportsByStatusData.labels}
              values={reportsByStatusData.values}
              colors={reportsByStatusData.colors}
              legend={reportsByStatusData.legend}
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

        <div className="flex flex-col gap-4">
          <UrgencyFilterChips
            chips={URGENCY_FILTER_CHIPS}
            selectedChip={selectedUrgency}
            onSelectChip={handleSelectUrgency}
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
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800">
          <UrgencyFeedTable
            rows={visibleRows}
            onViewReport={onViewReport}
            onUpdateStatus={onUpdateStatus}
            canUpdateReport={(report) => canAdminUpdateReport({ profile, report })}
            isLoading={isLoading}
          />
        </div>

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
