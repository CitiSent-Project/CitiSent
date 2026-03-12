import { motion } from 'framer-motion'

const MotionDiv = motion.div

function SkeletonBlock({ className }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />
}

export function PageSkeleton({ pageKey }) {
  const isDashboard = pageKey === 'Dashboard'
  const isListHeavy = pageKey === 'Users' || pageKey === 'Notifications'

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8">
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="space-y-5"
      >
        <div className="flex items-center justify-between gap-3">
          <SkeletonBlock className="h-8 w-56" />
          <SkeletonBlock className="h-8 w-28" />
        </div>

        {isDashboard ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="mt-4 h-8 w-16" />
                  <SkeletonBlock className="mt-3 h-4 w-20" />
                </div>
              ))}
            </section>
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="mt-4 h-70 w-full" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="mt-4 h-70 w-full" />
              </div>
            </section>
          </>
        ) : null}

        {isListHeavy ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <SkeletonBlock className="h-10 w-64" />
              <SkeletonBlock className="h-10 w-28" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-13 w-full" />
              ))}
            </div>
          </section>
        ) : null}

        {!isDashboard && !isListHeavy ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SkeletonBlock className="h-6 w-48" />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-12 w-full" />
              ))}
            </div>
            <SkeletonBlock className="mt-5 h-12 w-44" />
          </section>
        ) : null}
      </MotionDiv>
    </main>
  )
}
