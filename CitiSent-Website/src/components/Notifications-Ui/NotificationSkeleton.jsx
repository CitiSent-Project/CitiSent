import React from 'react'

export function NotificationSkeleton() {
  return (
    <div
      aria-label="Loading notifications"
      className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80"
      role="status"
    >
      {[1, 2, 3, 4].map((key) => (
        <div
          key={key}
          className="animate-pulse flex items-start gap-3 sm:gap-4 bg-white dark:bg-slate-900 px-3.5 py-4 sm:px-5 sm:py-4.5"
        >
          {/* Avatar skeleton */}
          <div className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800" />
          
          {/* Content skeleton */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="h-4 w-36 sm:w-48 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="h-6 w-6 shrink-0 rounded-md bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="mt-2.5 h-3.5 w-4/5 rounded-md bg-slate-200/80 dark:bg-slate-800/80" />
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800/60" />
              <div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800/60" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading notifications...</span>
    </div>
  )
}

