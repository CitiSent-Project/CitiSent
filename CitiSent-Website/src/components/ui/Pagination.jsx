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
      className={`flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300 ${className}`}
    >
      <button
        type="button"
        onClick={onPrevious}
        disabled={isPreviousDisabled}
        className="rounded-full border border-slate-200 bg-white px-3 py-1 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        Previous
      </button>

      {visiblePages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`h-8 w-8 rounded-full border font-numeric transition ${
            page === currentPage
              ? "border-slate-300 bg-blue-900 text-white dark:border-blue-500 dark:bg-blue-600"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          {page}
        </button>
      ))}

      {shouldShowTrailingTotal ? <span className="px-2">...</span> : null}
      {shouldShowTrailingTotal ? (
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-numeric dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {totalPages}
        </span>
      ) : null}

      <button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled}
        className="rounded-full border border-slate-200 bg-white px-3 py-1 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        Next
      </button>
    </div>
  );
}
