import { describe, expect, it } from 'vitest'
import {
  ALL_URGENCY_FILTER,
  REPORT_SORTING_OPTIONS,
  buildUserReportRows,
  buildVisiblePages,
  filterUserReportsByCategory,
  filterUserReportsByUrgency,
  paginateReports,
  sortReports,
  sortReportsByLatest,
} from '../reports/userReportsController'

describe('userReportsController', () => {
  const rows = [
    { id: 'R-1', categoryId: 'bplo', urgency: 'High', dateValue: 1700000000000 },
    { id: 'R-2', categoryId: 'cto', urgency: 'Critical', dateValue: 1700000001000 },
    { id: 'R-3', categoryId: 'bplo', urgency: 'Low', dateValue: 1699999999000 },
  ]

  it('sorts reports by latest dateValue first', () => {
    expect(sortReportsByLatest(rows).map((row) => row.id)).toEqual(['R-2', 'R-1', 'R-3'])
  })

  it('sorts reports by oldest dateValue first', () => {
    expect(
      sortReports(rows, REPORT_SORTING_OPTIONS.OLDEST_FIRST).map((row) => row.id)
    ).toEqual(['R-3', 'R-1', 'R-2'])
  })

  it('sorts reports by highest urgency and uses latest date as a tie breaker', () => {
    const urgencyRows = [
      { id: 'R-1', urgency: 'High', dateValue: 1700000000000 },
      { id: 'R-2', urgency: 'Critical', dateValue: 1699999999000 },
      { id: 'R-3', urgency: 'Critical', dateValue: 1700000001000 },
      { id: 'R-4', urgency: 'Low', dateValue: 1700000002000 },
    ]

    expect(
      sortReports(urgencyRows, REPORT_SORTING_OPTIONS.HIGHEST_URGENCY).map((row) => row.id)
    ).toEqual(['R-3', 'R-2', 'R-1', 'R-4'])
  })

  it('maps normalized users and reports into feed rows', () => {
    const mappedRows = buildUserReportRows({
      users: [
        {
          userId: 1001,
          firstName: 'Liam',
          lastName: 'Garcia',
          email: 'liam.garcia@gmail.com',
        },
      ],
      userReports: [
        {
          reportNum: 201,
          userId: 1001,
          reportDescription: 'Road issue',
          reportCategory: 'ctmd',
          urgencyType: 'High',
          reportLocation: 'Poblacion East',
          source: 'Mobile App',
          createdAt: '2026-03-01T08:20:00.000Z',
          status: 'Pending',
        },
      ],
      agencies: [{ id: 'ctmd', label: 'City Traffic Management Division/Impounding Services' }],
    })

    expect(mappedRows[0]).toMatchObject({
      id: 'UR-201',
      userId: 1001,
      name: 'Liam Garcia',
      email: 'liam.garcia@gmail.com',
      categoryId: 'ctmd',
      category: 'City Traffic Management Division/Impounding Services',
      message: 'Road issue',
      urgency: 'High',
      status: 'Pending',
    })
  })

  it('returns all rows when superadmin selects all category filter', () => {
    const result = filterUserReportsByCategory({
      reports: rows,
      selectedCategoryId: 'all-categories',
      hasAllAccess: true,
      allCategoryFilterId: 'all-categories',
      sorting: REPORT_SORTING_OPTIONS.OLDEST_FIRST,
    })

    expect(result.map((row) => row.id)).toEqual(['R-3', 'R-1', 'R-2'])
  })

  it('returns only rows for selected category', () => {
    const result = filterUserReportsByCategory({
      reports: rows,
      selectedCategoryId: 'bplo',
      hasAllAccess: false,
      allCategoryFilterId: 'all-categories',
    })

    expect(result.map((row) => row.id)).toEqual(['R-1', 'R-3'])
  })

  it('returns all rows when urgency filter is all reports', () => {
    const result = filterUserReportsByUrgency({
      reports: rows,
      selectedUrgency: ALL_URGENCY_FILTER,
    })

    expect(result.map((row) => row.id)).toEqual(['R-2', 'R-1', 'R-3'])
  })

  it('returns only rows for selected urgency', () => {
    const result = filterUserReportsByUrgency({
      reports: rows,
      selectedUrgency: 'Critical',
    })

    expect(result.map((row) => row.id)).toEqual(['R-2'])
  })

  it('builds compact visible pages around current page', () => {
    expect(buildVisiblePages({ currentPage: 1, totalPages: 6 })).toEqual([1, 2, 3])
    expect(buildVisiblePages({ currentPage: 4, totalPages: 6 })).toEqual([3, 4, 5])
    expect(buildVisiblePages({ currentPage: 6, totalPages: 6 })).toEqual([4, 5, 6])
  })

  it('paginates report rows with safe current page', () => {
    const page = paginateReports({ rows, currentPage: 5, pageSize: 2 })

    expect(page.totalPages).toBe(2)
    expect(page.safeCurrentPage).toBe(2)
    expect(page.visibleRows.map((row) => row.id)).toEqual(['R-3'])
    expect(page.visiblePages).toEqual([1, 2])
  })
})
