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
          <div className="border-b border-slate-200 px-4 py-3 sm:px-5 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{displayModal.title}</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {displayModal.request?.adminName}: {displayModal.request?.currentDepartmentLabel} to{' '}
              {displayModal.request?.requestedDepartmentLabel}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5 px-4 py-4 sm:px-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Review notes</label>
              <textarea
                rows={4}
                value={reviewNotes}
                onChange={(event) => onReviewNotesChange(event.target.value)}
                placeholder={displayModal.prompt}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
              {reviewError ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{reviewError}</p> : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3.5 dark:border-slate-800">
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={isSubmittingReview}
                whileHover={{ scale: isSubmittingReview ? 1 : 1.01 }}
                whileTap={{ scale: isSubmittingReview ? 1 : 0.98 }}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
                  displayModal.mode === 'approve'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'
                    : 'border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/40'
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
