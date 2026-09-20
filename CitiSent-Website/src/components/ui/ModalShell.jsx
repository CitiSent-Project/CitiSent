import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { getMotionVariants, modalBackdropVariants, modalCardVariants } from '../../utils/motionVariants'

/**
 * Reusable animated modal shell incorporating Framer Motion AnimatePresence,
 * backdrop blur, smooth card scaling, dark mode support, and accessibility.
 */
export function ModalShell({
  isOpen,
  onClose,
  children,
  dialogRef,
  role = 'dialog',
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  maxWidth = 'max-w-lg',
  className = '',
  backdropClassName = '',
  closeOnBackdropClick = true,
}) {
  const prefersReduced = useReducedMotion()
  const backdropVariants = getMotionVariants(modalBackdropVariants, prefersReduced)
  const cardVariants = getMotionVariants(modalCardVariants, prefersReduced)

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className={`fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-3 sm:p-4 backdrop-blur-xs dark:bg-slate-900/60 ${backdropClassName}`.trim()}
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onMouseDown={(event) => {
            if (closeOnBackdropClick && event.target === event.currentTarget) {
              onClose?.()
            }
          }}
        >
          <motion.div
            ref={dialogRef}
            role={role}
            aria-modal="true"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            tabIndex={-1}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`max-h-[calc(100vh-1.5rem)] w-full ${maxWidth} overflow-y-auto rounded-xl bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)] sm:rounded-2xl dark:border dark:border-slate-700 dark:bg-slate-800 ${className}`.trim()}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
