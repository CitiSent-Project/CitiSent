import { useMemo } from 'react'
import { ReportsStatCards, ReportHistoryTable } from '../../components/Reports-Ui'

export function History({
  rows,
  onViewReport,
  isLoading = false,
}) {
  const reportStats = useMemo(() => {
    const resolvedCount = rows.filter((row) => row.status === 'Resolved').length
    const unresolvedCount = rows.filter((row) => row.status === 'Unresolved').length
    const totalHistorical = resolvedCount + unresolvedCount

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
        id: 'unresolved-reports',
        label: 'Unresolved / Rejected',
        value: String(unresolvedCount),
        icon: 'unresolved',
        accent: 'violet',
      },
    ]
  }, [rows])

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <header className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-slate-900">Report History & Audit Log</h1>
          <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 text-sm text-slate-700">!</span>
        </header>

        <section className="rounded-2xl bg-[#5f82bd] p-4 md:p-6">
          <ReportsStatCards stats={reportStats} />
        </section>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <ReportHistoryTable
            rows={rows}
            onViewReport={onViewReport}
            isLoading={isLoading}
          />
        </div>
      </div>
    </main>
  )
}
