export function TransferReviewModal({
  reviewModal,
  reviewModalRef,
  reviewNotes,
  reviewError,
  onClose,
  onSubmit,
  onReviewNotesChange,
  isSubmittingReview,
}) {
  if (!reviewModal) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-3 sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        ref={reviewModalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Transfer review modal"
        tabIndex={-1}
        className="max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl sm:max-h-[calc(100vh-2rem)] sm:rounded-2xl dark:bg-slate-800 dark:border dark:border-slate-700"
      >
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{reviewModal.title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {reviewModal.request.adminName}: {reviewModal.request.currentDepartmentLabel} to{' '}
            {reviewModal.request.requestedDepartmentLabel}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-4 py-4 sm:px-5">
          <div>
            <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Review notes</label>
            <textarea
              rows={4}
              value={reviewNotes}
              onChange={(event) => onReviewNotesChange(event.target.value)}
              placeholder={reviewModal.prompt}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            />
            {reviewError ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{reviewError}</p> : null}
          </div>

          <div className="grid gap-2 border-t border-slate-200 pt-4 sm:flex sm:justify-end dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 sm:py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingReview}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:py-2 ${
                reviewModal.mode === 'approve'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'
                  : 'border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-slate-700'
              }`}
            >
              {isSubmittingReview ? 'Submitting...' : reviewModal.cta}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
