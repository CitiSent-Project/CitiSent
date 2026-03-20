import { useMemo, useState } from 'react'
import { paginateReports } from '../controllers/userReportsController'

export function useReportPaginationState({ rows = [], pageSize = 6 }) {
  const [currentPage, setCurrentPage] = useState(1)

  const pagination = useMemo(
    () => paginateReports({ rows, currentPage, pageSize }),
    [rows, currentPage, pageSize]
  )

  function handlePageChange(page) {
    setCurrentPage(page)
  }

  function handleNextPage() {
    setCurrentPage((page) => Math.min(page + 1, pagination.totalPages))
  }

  function handlePreviousPage() {
    setCurrentPage((page) => Math.max(page - 1, 1))
  }

  function resetToFirstPage() {
    setCurrentPage(1)
  }

  return {
    currentPage,
    setCurrentPage,
    handlePageChange,
    handleNextPage,
    handlePreviousPage,
    resetToFirstPage,
    ...pagination,
  }
}
