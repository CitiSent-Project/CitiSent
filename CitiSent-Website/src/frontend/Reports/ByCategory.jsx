import { PieChart } from '../../components/Dashbord-Ui/Pie-Chart'
import { VerticalChart } from '../../components/Dashbord-Ui/Vertical-Chart'
import { AgencyCardsGrid, ReportsStatCards } from '../../components/Reports-Ui'
import {
  categoryAgencyCards,
  reportsByCategoryData,
  reportsSummaryStats,
  reportsThisWeekData,
} from '../Data/reportsData'

export function ByCategory() {
  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-5">
        <header className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-slate-900">Reports</h1>
          <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 text-sm text-slate-700">
            !
          </span>
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

        <AgencyCardsGrid items={categoryAgencyCards} />
      </div>
    </main>
  )
}
