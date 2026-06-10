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
        className="max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl sm:max-h-[calc(100vh-2rem)] sm:rounded-2xl"
      >
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <h3 className="text-lg font-semibold text-slate-900">{reviewModal.title}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {reviewModal.request.adminName}: {reviewModal.request.currentDepartmentLabel} to{' '}
            {reviewModal.request.requestedDepartmentLabel}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-4 py-4 sm:px-5">
          <div>
            <label className="mb-1 block text-sm text-slate-700">Review notes</label>
            <textarea
              rows={4}
              value={reviewNotes}
              onChange={(event) => onReviewNotesChange(event.target.value)}
              placeholder={reviewModal.prompt}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
            />
            {reviewError ? <p className="mt-1 text-xs text-rose-600">{reviewError}</p> : null}
          </div>

          <div className="grid gap-2 border-t border-slate-200 pt-4 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-300 sm:py-2 theme-dark-btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingReview}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-blue-700 transition disabled:cursor-not-allowed disabled:opacity-50 sm:py-2 ${
                reviewModal.mode === 'approve'
                  ? 'bg-blue-700 hover:bg-blue-600 text-white theme-dark-btn-primary'
                  : 'border border-blue-700 hover:bg-blue-500 hover:text-white hover:border-white theme-dark-btn-outline'
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
