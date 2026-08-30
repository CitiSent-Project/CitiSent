import { Pagination } from '../ui/Pagination'

export function UsersPagination({
  currentPage,
  totalPages,
  visiblePages,
  onPageChange,
  onNextPage,
  onPreviousPage,
}) {
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      visiblePages={visiblePages}
      onPageChange={onPageChange}
      onNext={onNextPage}
      onPrevious={onPreviousPage}
      className="border-t border-slate-100 bg-slate-50/30 px-5 py-4 dark:border-slate-700/50 dark:bg-slate-800/20"
    />
  )
}
