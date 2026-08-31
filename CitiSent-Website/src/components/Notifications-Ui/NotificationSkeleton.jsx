import React from 'react'

export function NotificationSkeleton() {
  return (
    <div
      aria-label="Loading notifications"
      className="flex flex-col"
      role="status"
    >
      {[1, 2, 3].map((key) => (
        <div
          key={key}
          className="animate-pulse flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 bg-white px-4 py-5"
        >
          <div className="flex flex-1 min-w-0 items-start gap-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
            
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="h-3.5 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-1/4 rounded bg-slate-100" />
            </div>
          </div>
          
          <div className="ml-14 sm:ml-0 h-8 w-8 shrink-0 self-start rounded-full bg-slate-200" />
        </div>
      ))}
      <span className="sr-only">Loading notifications...</span>
    </div>
  )
}
