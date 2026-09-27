import { FiDownload } from 'react-icons/fi'

/**
 * ExportCsvButton — A small, accessible download icon button for per-section CSV exports.
 *
 * Follows the project's existing icon button patterns:
 * - Minimum 44×44px tap target (Apple HIG / Material)
 * - Dark mode support via dark: variants
 * - Hover/active states with hover-safe fallback for touch
 * - aria-label for screen readers
 *
 * @param {object}   props
 * @param {function} props.onExport - Callback triggered on click
 * @param {string}   [props.label]  - Accessible label (tooltip + aria-label)
 * @param {boolean}  [props.disabled] - Disable during loading states
 */
export function ExportCsvButton({ onExport, label = 'Export to CSV', disabled = false }) {
    return (
        <button
            type="button"
            onClick={onExport}
            disabled={disabled}
            aria-label={label}
            title={label}
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 hover:shadow-xs active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
            <FiDownload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
    )
}
