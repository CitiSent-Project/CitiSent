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
      className="border-t border-slate-200 px-4 py-4"
    />
  )
}
