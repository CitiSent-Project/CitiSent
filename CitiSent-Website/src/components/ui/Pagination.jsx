export function Pagination({
  currentPage,
  totalPages,
  visiblePages,
  onPageChange,
  onNext,
  onPrevious,
  className = '',
}) {
  const isPreviousDisabled = currentPage <= 1
  const isNextDisabled = currentPage >= totalPages

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600 ${className}`}>
      <button
        type="button"
        onClick={onPrevious}
        disabled={isPreviousDisabled}
        className="rounded-full border border-blue-900 bg-white px-3 py-1 font-medium text-blue-900 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      {visiblePages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`h-8 w-8 rounded-full border ${
            page === currentPage
              ? 'border-blue-900 bg-blue-900 text-white'
              : 'border-blue-900 bg-white text-blue-900 hover:bg-blue-50'
          }`}
        >
          {page}
        </button>
      ))}

      {visiblePages[visiblePages.length - 1] < totalPages ? <span className="px-2">...</span> : null}
      <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{totalPages}</span>

      <button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled}
        className="rounded-full border border-blue-900 bg-white px-3 py-1 font-medium text-blue-900 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  )
}
