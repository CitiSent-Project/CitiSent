import { useMemo } from 'react'
import { ReportsStatCards, ReportHistoryTable } from '../../components/Reports-Ui'

export function History({
  rows,
  onViewReport,
  isLoading = false,
}) {
  const reportStats = useMemo(() => {
    const resolvedCount = rows.filter((row) => row.status === 'Resolved').length
    const rejectedCount = rows.filter((row) => row.status === 'Rejected').length
    const totalHistorical = resolvedCount + rejectedCount

    return [
      {
        id: 'total-reports',
        label: 'Total Historical Reports',
        value: String(totalHistorical),
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
        id: 'rejected-reports',
        label: 'Rejected',
        value: String(rejectedCount),
        icon: 'rejected',
        accent: 'violet',
      },
    ]
  }, [rows])

  return (
    <main className="w-full flex-1 min-w-0 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8 dark:bg-slate-900">
      <div className="flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports History</h1>
          <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-300">!</span>
        </header>

        <section className="rounded-2xl bg-[#5f82bd] p-4 md:p-6 shadow-sm dark:bg-slate-800">
          <ReportsStatCards stats={reportStats} />
        </section>

        <ReportHistoryTable
          rows={rows}
          onViewReport={onViewReport}
          isLoading={isLoading}
        />
      </div>
    </main>
  )
}
