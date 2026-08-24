import React from 'react'

export function NotificationSkeleton() {
  return (
    <div
      aria-label="Loading notifications"
      className="space-y-3"
      role="status"
    >
      {[1, 2, 3].map((key) => (
        <div
          key={key}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-9 w-9 rounded-xl bg-slate-200 shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-40 rounded-md bg-slate-200" />
                  <div className="h-4 w-16 rounded-full bg-slate-200" />
                </div>
                <div className="h-3.5 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-1/3 rounded bg-slate-100" />
              </div>
            </div>
            <div className="h-8 w-24 rounded-lg bg-slate-200 shrink-0 self-start" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading notifications...</span>
    </div>
  )
}
