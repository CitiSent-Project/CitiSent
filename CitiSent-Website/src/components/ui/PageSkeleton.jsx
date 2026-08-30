import { motion, useReducedMotion } from 'framer-motion'
import { APP_PAGES } from '../../models/pageModel'

const MotionDiv = motion.div

function SkeletonBlock({ className = '', style }) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-700/80 ${className}`.trim()}
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
        <div className="relative h-56 w-56 sm:h-64 sm:w-64 animate-pulse rounded-full border-24 sm:border-32 border-slate-200/80 dark:border-slate-700/80" />
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

/** Admin Management: Catalog Cards + Admin Accounts Table */
function AdminManagementSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton titleWidth="w-52" actionWidth="w-36" />

      {/* Agency Catalog Cards */}
      <section aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {renderRepeated(3, (index) => (
          <CardSkeleton key={index} className="p-5">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-3 w-20" />
              </div>
              <SkeletonBlock className="h-6 w-11 rounded-full" />
            </div>
          </CardSkeleton>
        ))}
      </section>

      {/* Admin Users Table */}
      <CardSkeleton className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <SkeletonBlock className="h-5 w-44" />
          <SkeletonBlock className="h-9 w-64 rounded-xl" />
        </div>
        <div className="space-y-3">
          {renderRepeated(5, (index) => (
            <SkeletonBlock key={index} className="h-14 w-full rounded-xl" />
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

/** List / Table Heavy Pages (Users, Notifications, History) */
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

        <div aria-hidden="true" className="space-y-3">
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
  const isListHeavy =
    pageKey === APP_PAGES.USERS ||
    pageKey === APP_PAGES.NOTIFICATIONS ||
    pageKey === APP_PAGES.REPORTS_HISTORY

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
      className="mx-auto max-w-350 flex-1 bg-[#eef2f8] dark:bg-[#0f172a] px-4 py-6 md:px-6 lg:px-8"
    >
      <MotionDiv {...motionProps}>
        <span className="sr-only">Loading page content...</span>

        {isDashboard ? <DashboardSkeleton /> : null}
        {isConversations ? <ConversationsSkeleton /> : null}
        {isReportDetail ? <ReportDetailSkeleton /> : null}
        {isAdminManagement ? <AdminManagementSkeleton /> : null}
        {isReportsGrid ? <GridReportsSkeleton /> : null}
        {isListHeavy ? <ListHeavySkeleton /> : null}
        {!isDashboard &&
        !isConversations &&
        !isReportDetail &&
        !isAdminManagement &&
        !isReportsGrid &&
        !isListHeavy ? (
          <FormPageSkeleton />
        ) : null}
      </MotionDiv>
    </main>
  )
}

