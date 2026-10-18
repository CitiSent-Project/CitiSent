import { FiArrowLeft, FiArrowRight, FiCheck, FiX } from 'react-icons/fi'

export function TourPopover({
  guideItem,
  isTour = false,
  stepIndex = 0,
  totalSteps = 1,
  onNext,
  onPrev,
  onSkip,
  onClose,
  onStartFullTour,
}) {
  if (!guideItem) return null

  const isLastStep = stepIndex >= totalSteps - 1
  const isFirstStep = stepIndex === 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={guideItem.title || 'Component Guide'}
      className="relative z-50 w-full max-w-[calc(100vw-1.5rem)] sm:w-96 sm:max-w-md max-h-[82vh] sm:max-h-[75vh] flex flex-col rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xl transition-all dark:border-slate-700/80 dark:bg-slate-800 overflow-hidden"
    >
      {/* Top Header Row with Lightbulb & Dismiss Button */}
      <div className="flex items-start justify-between gap-3 mb-2.5 sm:mb-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg shadow-xs dark:bg-amber-950/60 dark:text-amber-400">
            <span role="img" aria-label="lightbulb">💡</span>
          </div>
          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
              {guideItem.title || 'What is this component?'}
            </h4>
            {isTour && (
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                Step {stepIndex + 1} of {totalSteps}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 cursor-pointer before:content-[''] before:absolute before:-inset-1 before:rounded-lg"
          aria-label="Close guide"
        >
          <FiX className="text-base" />
        </button>
      </div>

      {/* Scrollable Body Content */}
      <div className="overflow-y-auto pr-1 -mr-1 flex-1 space-y-2.5 sm:space-y-3 overscroll-contain">
        <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {guideItem.body}
        </p>

        {guideItem.tip && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-2.5 text-[11px] sm:text-xs text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300 flex items-start gap-1.5">
            <span className="font-bold shrink-0">Tip:</span>
            <span>{guideItem.tip}</span>
          </div>
        )}
      </div>

      {/* Action Footer Buttons */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2.5 sm:mt-3 dark:border-slate-700 shrink-0 gap-2">
        {isTour ? (
          <>
            <button
              type="button"
              onClick={onSkip}
              className="rounded-lg px-2.5 sm:px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition cursor-pointer min-h-9.5 flex items-center"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={onPrev}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition cursor-pointer min-h-9.5"
                >
                  <FiArrowLeft className="text-xs" />
                  Back
                </button>
              )}

              <button
                type="button"
                onClick={onNext}
                className={newFunction()}
              >
                {isLastStep ? (
                  <>
                    <FiCheck className="text-xs" />
                    Got it, thanks!
                  </>
                ) : (
                  <>
                    Next
                    <FiArrowRight className="text-xs" />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {onStartFullTour && (
              <button
                type="button"
                onClick={onStartFullTour}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 cursor-pointer py-1"
              >
                Take full page tour
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition cursor-pointer dark:bg-blue-500 dark:hover:bg-blue-600 min-h-9.5"
            >
              Got it, thanks!
            </button>
          </>
        )}
      </div>
    </div>
  )

  function newFunction() {
    return "inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition cursor-pointer dark:bg-blue-500 dark:hover:bg-blue-600 min-h-[38px]"
  }
}
