import { motion, useReducedMotion } from "framer-motion";
import { APP_PAGES } from "../../models/pageModel";

const MotionDiv = motion.div;
const LIST_HEAVY_PAGES = new Set([APP_PAGES.USERS, APP_PAGES.NOTIFICATIONS]);

function SkeletonBlock({ className }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`}
    />
  );
}

function CardSkeleton({ className = "", children }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`.trim()}
    >
      {children}
    </div>
  );
}

function renderRepeatedSkeletons(count, renderItem) {
  return Array.from({ length: count }).map((_, index) => renderItem(index));
}

export function PageSkeleton({ pageKey }) {
  const prefersReducedMotion = useReducedMotion();
  const isDashboard = pageKey === APP_PAGES.DASHBOARD;
  const isListHeavy = LIST_HEAVY_PAGES.has(pageKey);
  const motionProps = prefersReducedMotion
    ? { initial: false, animate: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2 },
      };

  return (
    <main
      aria-busy="true"
      className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8"
    >
      <MotionDiv
        aria-atomic="true"
        aria-live="polite"
        {...motionProps}
        className="space-y-5"
      >
        <span className="sr-only">Loading...</span>

        <div aria-hidden="true" className="flex items-center justify-between gap-3">
          <SkeletonBlock className="h-8 w-56" />
          <SkeletonBlock className="h-8 w-28" />
        </div>

        {isDashboard ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {renderRepeatedSkeletons(4, (index) => (
                <CardSkeleton key={index} className="p-4">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="mt-4 h-8 w-16" />
                  <SkeletonBlock className="mt-3 h-4 w-20" />
                </CardSkeleton>
              ))}
            </section>
            <section className="grid gap-4 lg:grid-cols-2">
              <CardSkeleton className="p-4">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="mt-4 h-70 w-full" />
              </CardSkeleton>
              <CardSkeleton className="p-4">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="mt-4 h-70 w-full" />
              </CardSkeleton>
            </section>
          </>
        ) : null}

        {isListHeavy ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div aria-hidden="true" className="mb-4 flex items-center justify-between gap-3">
              <SkeletonBlock className="h-10 w-64" />
              <SkeletonBlock className="h-10 w-28" />
            </div>
            <div className="space-y-3">
              {renderRepeatedSkeletons(7, (index) => (
                <SkeletonBlock key={index} className="h-13 w-full" />
              ))}
            </div>
          </section>
        ) : null}

        {!isDashboard && !isListHeavy ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SkeletonBlock className="h-6 w-48" />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {renderRepeatedSkeletons(6, (index) => (
                <SkeletonBlock key={index} className="h-12 w-full" />
              ))}
            </div>
            <SkeletonBlock className="mt-5 h-12 w-44" />
          </section>
        ) : null}
      </MotionDiv>
    </main>
  );
}
