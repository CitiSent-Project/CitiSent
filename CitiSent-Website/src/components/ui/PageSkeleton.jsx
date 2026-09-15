import { motion, useReducedMotion } from 'framer-motion'
import { APP_PAGES } from '../../models/pageModel'

const MotionDiv = motion.div

function SkeletonBlock({ className = '', style }) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`animate-shimmer rounded-xl bg-slate-200/80 dark:bg-slate-700/80 ${className}`.trim()}
    />
  )
}

function CardSkeleton({ className = '', children }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/90 shadow-xs backdrop-blur-xs ${className}`.trim()}
    >
      {children}
    </div>
  )
}

function renderRepeated(count, renderItem) {
  return Array.from({ length: count }).map((_, index) => renderItem(index))
}

/** Header bar skeleton with title & action button placeholders */
function HeaderSkeleton({ titleWidth = 'w-48', actionWidth = 'w-28' }) {
  return (
    <div aria-hidden="true" className="flex items-center justify-between gap-3 pb-1">
      <div className="space-y-1.5">
        <SkeletonBlock className={`h-7 ${titleWidth}`} />
        <SkeletonBlock className="h-3.5 w-64" />
      </div>
      {actionWidth ? <SkeletonBlock className={`h-9 ${actionWidth} rounded-xl`} /> : null}
    </div>
  )
}

function DonutChartSkeleton({ className = '' }) {
  return (
    <CardSkeleton className={`p-5 flex flex-col ${className}`}>
      <SkeletonBlock className="mb-8 h-5 w-40" />
      <div className="mb-8 flex flex-1 items-center justify-center">
        <div className="relative h-56 w-56 sm:h-64 sm:w-64 animate-shimmer rounded-full border-24 sm:border-32 border-slate-200/80 dark:border-slate-700/80" />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderRepeated(6, (i) => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonBlock className="h-2 w-2 rounded-full" />
            <SkeletonBlock className="h-3 w-full max-w-40" />
          </div>
        ))}
      </div>
    </CardSkeleton>
  )
}

function BarChartSkeleton({ className = '' }) {
  return (
    <CardSkeleton className={`p-5 flex flex-col ${className}`}>
      <SkeletonBlock className="mb-8 h-5 w-48" />
      <div className="mt-6 flex flex-1 min-h-62.5 items-end justify-between gap-2 sm:gap-4 border-b border-l border-slate-100 dark:border-slate-700/50 px-2 pb-1">
        {[20, 40, 30, 80, 50, 60, 40].map((height, i) => (
          <div key={i} className="flex w-full flex-col items-center gap-2">
            <SkeletonBlock className="w-full max-w-8 sm:max-w-12 rounded-t-sm" style={{ height: `${height}%` }} />
            <SkeletonBlock className="h-2 w-6 sm:w-8" />
          </div>
        ))}
      </div>
    </CardSkeleton>
  )
}

function TableCardSkeleton({ titleWidth = 'w-32', columns = [], rows = 4, className = '' }) {
  return (
    <CardSkeleton className={`overflow-hidden p-0 flex flex-col ${className}`}>
      <div className="border-b border-slate-100 dark:border-slate-700/50 p-5">
        <SkeletonBlock className={`h-5 ${titleWidth}`} />
      </div>
      <div className="p-5 flex-1">
        <div className="mb-4 flex gap-4">
          {columns.map((col, i) => (
            <div key={i} className={col}>
               <SkeletonBlock className="h-3 w-full max-w-25" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {renderRepeated(rows, (i) => (
            <div key={i} className="flex items-center gap-4 border-t border-slate-50 dark:border-slate-700/50 pt-4">
              {columns.map((col, colIndex) => (
                <div key={colIndex} className={`flex items-center gap-3 ${col}`}>
                  {colIndex === 0 && <SkeletonBlock className="h-8 w-8 shrink-0 rounded-full" />}
                  <SkeletonBlock className="h-3 w-full max-w-35" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </CardSkeleton>
  )
}

/** Dashboard: 4 Stat Cards + Analytics Chart + Recent Reports Table */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton titleWidth="w-56" actionWidth="w-32" />

      {/* 4 Stat KPI Cards */}
      <section aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {renderRepeated(4, (index) => (
          <CardSkeleton key={index} className="p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between">
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-8 w-16" />
              </div>
              <SkeletonBlock className="h-8 w-8 rounded-full" />
            </div>
            <SkeletonBlock className="mt-4 h-2 w-12" />
          </CardSkeleton>
        ))}
      </section>

      {/* Analytics Charts */}
      <section aria-hidden="true" className="grid gap-5 lg:grid-cols-2">
        <DonutChartSkeleton />
        <BarChartSkeleton />
      </section>

      {/* Data Tables */}
      <section aria-hidden="true" className="grid gap-5 lg:grid-cols-2">
        <TableCardSkeleton 
          titleWidth="w-24" 
          columns={['w-full sm:w-1/2 lg:w-1/3', 'hidden sm:flex sm:w-1/2 lg:w-1/3', 'hidden lg:flex lg:w-1/3']} 
          rows={4} 
        />
        <TableCardSkeleton 
          titleWidth="w-40" 
          columns={['w-full sm:w-1/2', 'hidden sm:flex sm:w-1/2']} 
          rows={4} 
        />
      </section>
    </div>
  )
}

/** Conversations Page: Split panel layout */
function ConversationsSkeleton() {
  return (
    <div className="space-y-4">
      <HeaderSkeleton titleWidth="w-44" actionWidth="" />

      <CardSkeleton className="flex h-[calc(100vh-10rem)] min-h-130 overflow-hidden p-0">
        {/* Left Sidebar */}
        <div className="flex w-full flex-col border-r border-slate-200 p-4 md:w-85 md:shrink-0 lg:w-90 dark:border-slate-700/50">
          <SkeletonBlock className="h-10 w-full rounded-xl" />
          <div className="mt-4 space-y-3">
            {renderRepeated(6, (index) => (
              <div key={index} className="flex items-center gap-3 rounded-xl p-2.5">
                <SkeletonBlock className="h-11 w-11 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <SkeletonBlock className="h-4 w-28" />
                    <SkeletonBlock className="h-3 w-10" />
                  </div>
                  <SkeletonBlock className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Chat Panel */}
        <div className="hidden flex-1 flex-col md:flex">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900/90 p-4 dark:border-slate-700/50 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-9 w-9 rounded-full bg-slate-700" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-4 w-32 bg-slate-700" />
                <SkeletonBlock className="h-3 w-20 bg-slate-700" />
              </div>
            </div>
            <SkeletonBlock className="h-8 w-24 rounded-lg bg-slate-700" />
          </div>

          <div className="flex-1 space-y-4 bg-slate-50/50 p-5 dark:bg-slate-800/50">
            <div className="flex justify-start">
              <SkeletonBlock className="h-12 w-64 rounded-2xl rounded-tl-xs" />
            </div>
            <div className="flex justify-end">
              <SkeletonBlock className="h-14 w-72 rounded-2xl rounded-tr-xs bg-blue-200/80 dark:bg-blue-900/40" />
            </div>
            <div className="flex justify-start">
              <SkeletonBlock className="h-10 w-48 rounded-2xl rounded-tl-xs" />
            </div>
          </div>

          <div className="border-t border-slate-200 p-4 dark:border-slate-700/50">
            <SkeletonBlock className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </CardSkeleton>
    </div>
  )
}

/** Report Detail Page: Header + 2-Column Details + Map & Media */
function ReportDetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-9 w-9 rounded-xl" />
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="ml-auto h-7 w-24 rounded-full" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Main Details */}
        <div className="space-y-5 lg:col-span-2">
          <CardSkeleton className="p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-700/50">
              <div className="space-y-2">
                <SkeletonBlock className="h-6 w-64" />
                <SkeletonBlock className="h-4 w-36" />
              </div>
              <SkeletonBlock className="h-8 w-24 rounded-full" />
            </div>

            <div className="mt-5 flex items-center gap-3">
              <SkeletonBlock className="h-12 w-12 rounded-full" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-3 w-40" />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-11/12" />
              <SkeletonBlock className="h-4 w-4/5" />
            </div>

            <div className="mt-6 flex flex-wrap gap-2 pt-2">
              <SkeletonBlock className="h-8 w-28 rounded-lg" />
              <SkeletonBlock className="h-8 w-32 rounded-lg" />
              <SkeletonBlock className="h-8 w-24 rounded-lg" />
            </div>
          </CardSkeleton>

          {/* Timeline Card */}
          <CardSkeleton className="p-6">
            <SkeletonBlock className="mb-4 h-5 w-40" />
            <div className="space-y-4">
              {renderRepeated(3, (index) => (
                <div key={index} className="flex gap-3">
                  <SkeletonBlock className="mt-1 h-4 w-4 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonBlock className="h-4 w-48" />
                    <SkeletonBlock className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </CardSkeleton>
        </div>

        {/* Right Column: Map & Media */}
        <div className="space-y-5">
          <CardSkeleton className="p-5">
            <SkeletonBlock className="mb-3 h-5 w-32" />
            <SkeletonBlock className="h-48 w-full rounded-xl" />
            <SkeletonBlock className="mt-3 h-3 w-44" />
          </CardSkeleton>

          <CardSkeleton className="p-5">
            <SkeletonBlock className="mb-3 h-5 w-28" />
            <div className="grid grid-cols-2 gap-2">
              <SkeletonBlock className="h-28 w-full rounded-xl" />
              <SkeletonBlock className="h-28 w-full rounded-xl" />
            </div>
          </CardSkeleton>
        </div>
      </div>
    </div>
  )
}

/** Admin Management: Header + Office Admin Assignments (Mobile Cards / Desktop Table) + Department Catalog + Transfer Queue */
function AdminManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-5 sm:p-6 border border-slate-200/80 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800">
        <div className="space-y-1.5">
          <SkeletonBlock className="h-7 w-52 sm:w-60" />
          <SkeletonBlock className="h-3.5 w-64 max-w-full sm:w-96" />
        </div>
        <SkeletonBlock className="h-10 w-full sm:w-32 rounded-xl" />
      </div>

      {/* Office Admin Assignments Section */}
      <CardSkeleton className="p-5 sm:p-6">
        {/* Section Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <SkeletonBlock className="h-5 w-48" />
            <SkeletonBlock className="h-3.5 w-64 max-w-full" />
          </div>
          <SkeletonBlock className="h-6 w-36 rounded-full" />
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100 dark:bg-slate-900/40 dark:border-slate-700/60">
          <div className="space-y-1">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-8.5 w-full rounded-lg" />
          </div>
          <div className="space-y-1">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-8.5 w-full rounded-lg" />
          </div>
        </div>

        {/* Mobile Cards List View (lg:hidden) */}
        <div className="mt-4 space-y-3 lg:hidden">
          {renderRepeated(3, (index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <SkeletonBlock className="h-4 w-32 max-w-full" />
                    <SkeletonBlock className="h-3 w-40 max-w-full" />
                  </div>
                </div>
                <SkeletonBlock className="h-5 w-18 shrink-0 rounded-full" />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <SkeletonBlock className="h-3 w-12" />
                <SkeletonBlock className="h-5 w-24 rounded-md" />
              </div>

              <div className="mt-4 space-y-2">
                <SkeletonBlock className="h-3 w-32" />
                <SkeletonBlock className="h-9 w-full rounded-lg" />
                <div className="flex items-center gap-2 pt-1">
                  <SkeletonBlock className="h-8 flex-1 rounded-lg" />
                  <SkeletonBlock className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View (hidden lg:block) */}
        <div className="mt-5 hidden overflow-hidden rounded-xl border border-slate-200/80 shadow-2xs lg:block dark:border-slate-700">
          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-3 dark:border-slate-700 dark:bg-slate-800/80">
            <div className="grid grid-cols-[18%_20%_17%_13%_17%_15%] gap-3 items-center">
              <SkeletonBlock className="h-3.5 w-16" />
              <SkeletonBlock className="h-3.5 w-16" />
              <SkeletonBlock className="h-3.5 w-28" />
              <SkeletonBlock className="h-3.5 w-20 mx-auto" />
              <SkeletonBlock className="h-3.5 w-28" />
              <SkeletonBlock className="h-3.5 w-16 mx-auto" />
            </div>
          </div>
          <div className="divide-y divide-slate-100 bg-white p-2 dark:divide-slate-700/60 dark:bg-slate-800">
            {renderRepeated(4, (index) => (
              <div key={index} className="grid grid-cols-[18%_20%_17%_13%_17%_15%] gap-3 items-center px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <SkeletonBlock className="h-8 w-8 shrink-0 rounded-full" />
                  <SkeletonBlock className="h-3.5 w-24" />
                </div>
                <SkeletonBlock className="h-3.5 w-32" />
                <SkeletonBlock className="h-6 w-28 rounded-md" />
                <SkeletonBlock className="h-5 w-20 rounded-full mx-auto" />
                <SkeletonBlock className="h-8 w-full rounded-lg" />
                <div className="flex items-center justify-center gap-2">
                  <SkeletonBlock className="h-7 w-16 rounded-lg" />
                  <SkeletonBlock className="h-7 w-16 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardSkeleton>

      {/* Department Catalog Section */}
      <CardSkeleton className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <SkeletonBlock className="h-5 w-44" />
            <SkeletonBlock className="h-3.5 w-60 max-w-full" />
          </div>
          <SkeletonBlock className="h-9 w-36 rounded-xl" />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {renderRepeated(3, (index) => (
            <div key={index} className="rounded-xl border border-slate-200/80 bg-white p-4.5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="h-11 w-11 rounded-xl" />
                  <div className="space-y-1.5">
                    <SkeletonBlock className="h-4 w-28" />
                    <SkeletonBlock className="h-3 w-16" />
                  </div>
                </div>
                <SkeletonBlock className="h-6 w-12 rounded-full" />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/60">
                <SkeletonBlock className="h-3.5 w-24" />
                <SkeletonBlock className="h-7 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </CardSkeleton>

      {/* Transfer Request Queue Section */}
      <CardSkeleton className="p-5 sm:p-6">
        <div className="space-y-1">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="h-3.5 w-64 max-w-full" />
        </div>
        <div className="mt-4 space-y-3">
          {renderRepeated(2, (index) => (
            <div key={index} className="rounded-xl border border-slate-200/80 bg-white p-4.5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <SkeletonBlock className="h-4 w-36" />
                <div className="flex items-center gap-2">
                  <SkeletonBlock className="h-5 w-18 rounded-full" />
                  <SkeletonBlock className="h-5 w-28 rounded-full" />
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <SkeletonBlock className="h-6 w-24 rounded-md" />
                <SkeletonBlock className="h-3 w-4" />
                <SkeletonBlock className="h-6 w-28 rounded-md" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <SkeletonBlock className="h-7 w-28 rounded-lg" />
                <SkeletonBlock className="h-7 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </CardSkeleton>
    </div>
  )
}

/** Reports Grid (By Category / Urgency / Feed) */
function GridReportsSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton titleWidth="w-48" actionWidth="w-32" />

      {/* Category / Filter Pills */}
      <div aria-hidden="true" className="flex gap-2 overflow-x-auto pb-1">
        {renderRepeated(5, (index) => (
          <SkeletonBlock key={index} className="h-9 w-28 shrink-0 rounded-full" />
        ))}
      </div>

      {/* 6 Report Cards Grid */}
      <section aria-hidden="true" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {renderRepeated(6, (index) => (
          <CardSkeleton key={index} className="p-5">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-6 w-24 rounded-full" />
              <SkeletonBlock className="h-6 w-16 rounded-full" />
            </div>
            <div className="mt-4 space-y-2">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-3/4" />
            </div>
            <SkeletonBlock className="mt-4 h-3.5 w-40" />
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-7 w-7 rounded-full" />
                <SkeletonBlock className="h-3 w-20" />
              </div>
              <SkeletonBlock className="h-3 w-16" />
            </div>
          </CardSkeleton>
        ))}
      </section>
    </div>
  )
}

/** Users Page Skeleton: Header + 3 KPI Stat Cards + Toolbar + Responsive User Cards / Table */
function UsersPageSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-7 w-32" />
        <SkeletonBlock className="h-6 w-6 rounded-full" />
      </div>

      {/* 3 KPI Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {renderRepeated(3, (index) => (
          <CardSkeleton key={index} className="flex items-center gap-4 p-5">
            <SkeletonBlock className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="space-y-1.5 flex-1">
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-8 w-14" />
            </div>
          </CardSkeleton>
        ))}
      </div>

      {/* Main Users Card */}
      <CardSkeleton className="overflow-hidden p-0">
        {/* Users Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <SkeletonBlock className="h-10 w-full md:max-w-xs rounded-xl" />
            <div className="flex flex-wrap items-center gap-2">
              <SkeletonBlock className="h-10 w-28 rounded-xl" />
              <SkeletonBlock className="h-10 w-24 rounded-xl" />
              <SkeletonBlock className="h-10 w-full md:w-28 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Mobile User Rows (lg:hidden) */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50 lg:hidden">
          {renderRepeated(5, (index) => (
            <div key={index} className="relative p-4">
              {/* Checkbox */}
              <div className="absolute left-4 top-4.5">
                <SkeletonBlock className="h-4 w-4 rounded-sm" />
              </div>
              {/* User Details */}
              <div className="flex min-w-0 items-center gap-3 ml-8 pr-11">
                <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBlock className="h-4 w-36 max-w-full" />
                  <SkeletonBlock className="h-3 w-20 max-w-full" />
                </div>
              </div>
              {/* Account Status */}
              <div className="mt-2.5 ml-11 flex items-center gap-2">
                <SkeletonBlock className="h-3 w-10" />
                <SkeletonBlock className="h-6 w-20 rounded-full" />
              </div>
              {/* Registered Date */}
              <div className="mt-2 ml-11 flex items-center gap-2">
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className="h-3.5 w-24" />
              </div>
              {/* Action button */}
              <div className="absolute right-4 top-4">
                <SkeletonBlock className="h-8.5 w-8.5 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View (hidden lg:block) */}
        <div className="hidden lg:block overflow-x-auto">
          <div className="grid grid-cols-[32px_minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_80px] items-center gap-4 border-b border-slate-200 bg-slate-50/50 px-5 py-3.5 text-xs font-semibold dark:border-slate-700/80 dark:bg-slate-800/50">
            <div className="flex justify-center">
              <SkeletonBlock className="h-4 w-4 rounded-sm" />
            </div>
            <SkeletonBlock className="h-3.5 w-24" />
            <SkeletonBlock className="h-3.5 w-24" />
            <SkeletonBlock className="h-3.5 w-28" />
            <div className="flex justify-end">
              <SkeletonBlock className="h-3.5 w-12" />
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {renderRepeated(5, (index) => (
              <div
                key={index}
                className="grid grid-cols-[32px_minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_80px] items-center gap-4 px-5 py-3.5"
              >
                <div className="flex justify-center">
                  <SkeletonBlock className="h-4 w-4 rounded-sm" />
                </div>
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="space-y-1.5">
                    <SkeletonBlock className="h-4 w-40" />
                    <SkeletonBlock className="h-3 w-24" />
                  </div>
                </div>
                <SkeletonBlock className="h-6 w-20 rounded-full" />
                <SkeletonBlock className="h-3.5 w-28" />
                <div className="flex justify-end">
                  <SkeletonBlock className="h-8.5 w-8.5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination placeholder */}
        <div className="flex justify-center p-4 border-t border-slate-100 dark:border-slate-700/50">
          <SkeletonBlock className="h-9 w-52 rounded-xl" />
        </div>
      </CardSkeleton>
    </div>
  )
}

/** History Page Skeleton: Header + 3 KPI Stat Cards + Filter Bar + Responsive History Cards / Table */
function HistoryPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-8 w-52" />
        <SkeletonBlock className="h-7 w-7 rounded-full" />
      </div>

      {/* 3 KPI Stat Cards */}
      <div className="rounded-2xl bg-[#5f82bd] p-4 md:p-6 shadow-sm dark:bg-slate-800">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {renderRepeated(3, (index) => (
            <div key={index} className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800">
              <SkeletonBlock className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl" />
              <div className="space-y-1.5 flex-1">
                <SkeletonBlock className="h-3.5 w-28" />
                <SkeletonBlock className="h-8 sm:h-9 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800">
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <SkeletonBlock className="h-8.5 w-36 rounded-lg" />
          <SkeletonBlock className="h-8.5 w-60 rounded-lg" />
          <SkeletonBlock className="h-8.5 w-32 rounded-lg" />
          <SkeletonBlock className="h-8.5 w-28 rounded-lg" />
        </div>
        <SkeletonBlock className="h-8.5 w-full lg:w-36 rounded-lg" />
      </div>

      {/* Mobile Card List View (md:hidden) */}
      <div className="block md:hidden space-y-3">
        {renderRepeated(4, (index) => (
          <div key={index} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-5 w-20 rounded" />
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="h-3 w-48 max-w-full" />
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <SkeletonBlock className="h-5 w-18 rounded-full" />
                <SkeletonBlock className="h-5 w-14 rounded-full" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/50">
              <div className="space-y-1">
                <SkeletonBlock className="h-3 w-32" />
                <SkeletonBlock className="h-3 w-28" />
              </div>
              <SkeletonBlock className="h-7 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View (hidden md:block) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-800">
        <div className="border-b border-slate-200 bg-slate-100/80 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/80">
          <div className="grid grid-cols-[12%_18%_18%_12%_12%_12%_14%] gap-2 items-center text-xs">
            <SkeletonBlock className="h-3.5 w-16" />
            <SkeletonBlock className="h-3.5 w-24" />
            <SkeletonBlock className="h-3.5 w-20" />
            <SkeletonBlock className="h-3.5 w-16" />
            <SkeletonBlock className="h-3.5 w-16" />
            <SkeletonBlock className="h-3.5 w-20" />
            <SkeletonBlock className="h-3.5 w-14 ml-auto" />
          </div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {renderRepeated(6, (index) => (
            <div key={index} className="grid grid-cols-[12%_18%_18%_12%_12%_12%_14%] gap-2 items-center px-4 py-3.5">
              <SkeletonBlock className="h-5 w-16 rounded font-mono" />
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-3.5 w-32" />
              <SkeletonBlock className="h-6 w-16 rounded-full" />
              <SkeletonBlock className="h-6 w-20 rounded-full" />
              <SkeletonBlock className="h-3.5 w-20" />
              <div className="flex justify-end">
                <SkeletonBlock className="h-7 w-18 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination placeholder */}
      <div className="flex justify-center pt-2">
        <SkeletonBlock className="h-9 w-52 rounded-xl" />
      </div>
    </div>
  )
}

/** Generic List Heavy Pages (Notifications) */
function ListHeavySkeleton() {
  return (
    <div className="space-y-5">
      <HeaderSkeleton titleWidth="w-44" actionWidth="w-32" />

      <CardSkeleton className="p-5 sm:p-6">
        <div aria-hidden="true" className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonBlock className="h-10 w-full rounded-xl sm:w-72" />
          <div className="flex gap-2">
            <SkeletonBlock className="h-10 w-28 rounded-xl" />
            <SkeletonBlock className="h-10 w-24 rounded-xl" />
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div aria-hidden="true" className="space-y-3 sm:hidden">
          {renderRepeated(5, (index) => (
            <div key={index} className="rounded-xl border border-slate-100 p-3.5 bg-slate-50/50 dark:border-slate-700/50 dark:bg-slate-800/50">
              <div className="flex items-start gap-3">
                <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBlock className="h-4 w-32" />
                  <SkeletonBlock className="h-3 w-48 max-w-full" />
                  <SkeletonBlock className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Rows */}
        <div aria-hidden="true" className="hidden sm:block space-y-3">
          {/* Table Header row */}
          <div className="flex items-center gap-4 border-b border-slate-100 px-3 py-2 dark:border-slate-700/50">
            <SkeletonBlock className="h-4 w-4 rounded-sm" />
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="ml-auto h-4 w-24" />
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-4 w-8" />
          </div>

          {/* Table Body rows */}
          {renderRepeated(7, (index) => (
            <div key={index} className="flex items-center gap-4 rounded-xl bg-slate-50/50 p-3 dark:bg-slate-800/50">
              <SkeletonBlock className="h-4 w-4 shrink-0 rounded-sm" />
              <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="h-3 w-48" />
              </div>
              <SkeletonBlock className="h-6 w-20 shrink-0 rounded-full" />
              <SkeletonBlock className="h-8 w-8 shrink-0 rounded-lg" />
            </div>
          ))}
        </div>
      </CardSkeleton>
    </div>
  )
}

/** Form Pages (Admin Profile, Settings, User Profile) */
function FormPageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <HeaderSkeleton titleWidth="w-44" actionWidth="" />

      {/* Profile Header Banner */}
      <CardSkeleton className="p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <SkeletonBlock className="h-20 w-20 shrink-0 rounded-full" />
          <div className="space-y-2 text-center sm:text-left">
            <SkeletonBlock className="mx-auto h-6 w-48 sm:mx-0" />
            <SkeletonBlock className="mx-auto h-4 w-32 sm:mx-0" />
            <SkeletonBlock className="mx-auto h-6 w-24 rounded-full sm:mx-0" />
          </div>
        </div>
      </CardSkeleton>

      {/* Form Fields Card */}
      <CardSkeleton className="p-6">
        <SkeletonBlock className="mb-6 h-5 w-40" />
        <div className="grid gap-5 md:grid-cols-2">
          {renderRepeated(6, (index) => (
            <div key={index} className="space-y-2">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-700/50">
          <SkeletonBlock className="h-10 w-24 rounded-xl" />
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
        </div>
      </CardSkeleton>
    </div>
  )
}

export function PageSkeleton({ pageKey }) {
  const prefersReducedMotion = useReducedMotion()

  const isDashboard = pageKey === APP_PAGES.DASHBOARD
  const isConversations = pageKey === APP_PAGES.CONVERSATIONS
  const isReportDetail = pageKey === APP_PAGES.REPORT_DETAIL
  const isAdminManagement = pageKey === APP_PAGES.ADMIN_MANAGEMENT
  const isReportsGrid =
    pageKey === APP_PAGES.REPORTS ||
    pageKey === APP_PAGES.REPORTS_BY_CATEGORY ||
    pageKey === APP_PAGES.REPORTS_BY_URGENCY
  const isUsers = pageKey === APP_PAGES.USERS
  const isHistory = pageKey === APP_PAGES.REPORTS_HISTORY
  const isListHeavy = pageKey === APP_PAGES.NOTIFICATIONS

  const motionProps = prefersReducedMotion
    ? { initial: false, animate: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25, ease: 'easeOut' },
      }

  return (
    <main
      id="page-skeleton"
      aria-busy="true"
      aria-live="polite"
      role="status"
      className="w-full flex-1 min-w-0 bg-[#eef2f8] dark:bg-slate-900 px-4 py-6 md:px-6 lg:px-8"
    >
      <MotionDiv {...motionProps}>
        <span className="sr-only">Loading page content...</span>

        {isDashboard ? <DashboardSkeleton /> : null}
        {isConversations ? <ConversationsSkeleton /> : null}
        {isReportDetail ? <ReportDetailSkeleton /> : null}
        {isAdminManagement ? <AdminManagementSkeleton /> : null}
        {isReportsGrid ? <GridReportsSkeleton /> : null}
        {isUsers ? <UsersPageSkeleton /> : null}
        {isHistory ? <HistoryPageSkeleton /> : null}
        {isListHeavy ? <ListHeavySkeleton /> : null}
        {!isDashboard &&
        !isConversations &&
        !isReportDetail &&
        !isAdminManagement &&
        !isReportsGrid &&
        !isUsers &&
        !isHistory &&
        !isListHeavy ? (
          <FormPageSkeleton />
        ) : null}
      </MotionDiv>
    </main>
  )
}

