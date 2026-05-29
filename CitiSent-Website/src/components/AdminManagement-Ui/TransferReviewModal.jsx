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
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
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
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{reviewModal.title}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {reviewModal.request.adminName}: {reviewModal.request.currentDepartmentLabel} to{' '}
            {reviewModal.request.requestedDepartmentLabel}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-5 py-4">
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

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white hover:bg-slate-300 px-4 py-2 text-sm text-slate-700 transition theme-dark-btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingReview}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed ${
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
