export function Pagination({
  currentPage,
  totalPages,
  visiblePages,
  onPageChange,
  onNext,
  onPrevious,
  className = "",
}) {
  const isPreviousDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;
  const lastVisiblePage = visiblePages[visiblePages.length - 1];
  const shouldShowTrailingTotal = lastVisiblePage < totalPages;

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 ${className}`}
    >
      <button
        type="button"
        onClick={onPrevious}
        disabled={isPreviousDisabled}
        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
      >
        Previous
      </button>

      {visiblePages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`h-7 w-7 rounded-md border font-numeric text-xs font-medium transition-colors cursor-pointer ${
            page === currentPage
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800"
          }`}
        >
          {page}
        </button>
      ))}

      {shouldShowTrailingTotal ? <span className="px-1.5 text-slate-400 text-xs">...</span> : null}
      {shouldShowTrailingTotal ? (
        <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-numeric text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {totalPages}
        </span>
      ) : null}

      <button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled}
        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
      >
        Next
      </button>
    </div>
  );
}
