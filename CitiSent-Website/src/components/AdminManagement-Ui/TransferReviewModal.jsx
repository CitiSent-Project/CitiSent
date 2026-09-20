import { motion } from 'framer-motion'
import { useLastNonNull } from '../../hooks/shared/useLastNonNull'
import { ModalShell } from '../ui/ModalShell'

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
  const displayModal = useLastNonNull(reviewModal)

  return (
    <ModalShell
      isOpen={Boolean(reviewModal && displayModal)}
      onClose={onClose}
      dialogRef={reviewModalRef}
      role="dialog"
      ariaLabel="Transfer review modal"
      maxWidth="max-w-lg"
      closeOnBackdropClick={!isSubmittingReview}
    >
      {displayModal && (
        <>
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{displayModal.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {displayModal.request?.adminName}: {displayModal.request?.currentDepartmentLabel} to{' '}
              {displayModal.request?.requestedDepartmentLabel}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 px-4 py-4 sm:px-5">
            <div>
              <label className="mb-1 block text-sm text-slate-700 dark:text-slate-300">Review notes</label>
              <textarea
                rows={4}
                value={reviewNotes}
                onChange={(event) => onReviewNotesChange(event.target.value)}
                placeholder={displayModal.prompt}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              />
              {reviewError ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{reviewError}</p> : null}
            </div>

            <div className="grid gap-2 border-t border-slate-200 pt-4 sm:flex sm:justify-end dark:border-slate-700">
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 sm:py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 cursor-pointer"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={isSubmittingReview}
                whileHover={{ scale: isSubmittingReview ? 1 : 1.02 }}
                whileTap={{ scale: isSubmittingReview ? 1 : 0.96 }}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:py-2 cursor-pointer ${
                  displayModal.mode === 'approve'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'
                    : 'border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-slate-700'
                }`}
              >
                {isSubmittingReview ? 'Submitting...' : displayModal.cta}
              </motion.button>
            </div>
          </form>
        </>
      )}
    </ModalShell>
  )
}
