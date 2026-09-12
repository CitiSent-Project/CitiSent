import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApiService } from '../../../services/api/admin/reportsApiService'
import { usersApiService } from '../../../services/api/admin/usersApiService'
import { mapBackendReportToUiRow } from '../../../services/api/admin/reportsApiMappers'
import { mapBackendUserToUiRow } from '../../../services/api/admin/accountsApiMappers'
import { loadFromStorageWithSchema } from '../../../services/storageService'
import { ADMIN_STORAGE_KEYS } from '../../../models/data'
import { getStorageSchemaRule } from '../../../models/storageSchemaModel'
import { UrgencyFeedTable, UrgencyFilterChips, Pagination } from '../../../components/Reports-Ui'
import { useReportPaginationState } from '../../../hooks/reports/useReportPaginationState'
import { useReportFeedRealtime } from '../../../hooks/reports/useReportFeedRealtime'
import { filterUserReportsByUrgency, ALL_URGENCY_FILTER } from '../../../controllers/reports/userReportsController'

const URGENCY_FILTER_CHIPS = ['All Reports', 'Critical', 'High', 'Medium', 'Low']

/**
 * Helper function to retrieve the stored admin session token.
 */
function getStoredAccessToken() {
  const schemaRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.accessToken)

  return loadFromStorageWithSchema(ADMIN_STORAGE_KEYS.accessToken, '', {
    schemaVersion: schemaRule.schemaVersion,
    migrate: schemaRule.migrate,
    validate: schemaRule.validate,
  })
}

export function UserProfilePage({ user, onBackToUsers, onViewReport }) {
  const accessToken = getStoredAccessToken()

  // Filter States
  const [selectedUrgency, setSelectedUrgency] = useState(ALL_URGENCY_FILTER)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Debounce search term changes to prevent layout flickering while typing
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 250)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchTerm])

  // Fetch full user profile (since the list only provides minimized data for DPA compliance)
  const {
    data: fullUser,
    isLoading: isUserLoading,
  } = useQuery({
    queryKey: ['admin-user-profile', user?.id, accessToken],
    enabled: Boolean(accessToken) && Boolean(user?.id),
    queryFn: async () => {
      const response = await usersApiService.getUserById(accessToken, user.id)
      return mapBackendUserToUiRow(response?.data)
    },
    retry: false,
  })

  // Use fullUser if available, fallback to minimized user prop
  const displayUser = fullUser || user

  // Fetch reports submitted by this specific user
  const {
    data: reports = [],
    isLoading,
    isFetching,
    error: reportsError,
    refetch: refetchReports,
  } = useQuery({
    queryKey: ['admin-user-reports', user?.id, accessToken],
    enabled: Boolean(accessToken) && Boolean(user?.id),
    queryFn: async () => {
      const response = await reportsApiService.listReports(accessToken, {
        limit: 100,
        offset: 0,
        userId: user.id,
      })
      return (response?.data || []).map(mapBackendReportToUiRow)
    },
    // Avoid a second report poller for every open user profile. The list is
    // refreshed when the user explicitly retries or revisits the page.
    retry: false,
  })

  const userId = user?.id

  // Real-time report feed: invalidate user reports when the server signals
  // a change that belongs to this specific user.
  const handleFeedInvalidate = useCallback(() => {
    if (userId) {
      refetchReports()
    }
  }, [userId, refetchReports])

  const shouldHandleEvent = useCallback(
    (payload) => {
      // Only react to events scoped to this user, or global/department events
      // (which may include new reports from this user that admins updated).
      if (!userId) return false
      if (payload?.scope === 'user' && payload?.scopeId !== userId) return false
      return true
    },
    [userId],
  )

  useReportFeedRealtime({
    accessToken,
    onInvalidate: handleFeedInvalidate,
    shouldHandle: shouldHandleEvent,
    enabled: Boolean(accessToken) && Boolean(userId),
  })
  // Filter fetched reports in memory
  const filteredReports = useMemo(() => {
    // 1. Filter by urgency level
    let result = filterUserReportsByUrgency({
      reports,
      selectedUrgency,
      allUrgencyFilter: ALL_URGENCY_FILTER,
      sorting: 'Latest first',
    })

    // 2. Filter by search term
    if (debouncedSearchTerm) {
      const low = debouncedSearchTerm.toLowerCase()
      result = result.filter((r) =>
        String(r.id || '').toLowerCase().includes(low) ||
        String(r.message || '').toLowerCase().includes(low) ||
        String(r.location || '').toLowerCase().includes(low) ||
        String(r.category || '').toLowerCase().includes(low)
      )
    }

    // 3. Filter by status
    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter)
    }

    return result
  }, [reports, selectedUrgency, debouncedSearchTerm, statusFilter])

  // Pagination hook
  const {
    totalPages,
    safeCurrentPage,
    visibleRows,
    visiblePages,
    handlePageChange,
    handleNextPage,
    handlePreviousPage,
    resetToFirstPage,
  } = useReportPaginationState({ rows: filteredReports, pageSize: 6 })

  function handleSelectUrgency(chip) {
    setSelectedUrgency(chip)
    resetToFirstPage()
  }

  function handleSearchChange(value) {
    setSearchTerm(value)
    resetToFirstPage()
  }

  function handleStatusChange(value) {
    setStatusFilter(value)
    resetToFirstPage()
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8 dark:bg-slate-900">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-800">
          <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            <button onClick={onBackToUsers} className="hover:text-slate-700 dark:hover:text-slate-200">Users</button> / <span>User Profile</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">User not found</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-350 flex-1 bg-[#eef2f8] px-4 py-6 md:px-6 lg:px-8 dark:bg-slate-900">
      <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        <button onClick={onBackToUsers} className="hover:text-slate-700 dark:hover:text-slate-200">Users</button> / <span className="text-slate-700 dark:text-slate-300">User Profile</span>
      </div>

      {/* User Information Details Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-800">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">User Profile</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">User ID</p>
            <p className="text-slate-900 font-numeric dark:text-slate-100 break-all">{displayUser.id}</p>
          </div>

          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</p>
            <p className="text-slate-900 dark:text-slate-100 break-all">{displayUser.email}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
            <p className="text-slate-900 dark:text-slate-100">{displayUser.status}</p>
          </div>
          {isUserLoading || displayUser.phoneNumber ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Phone Number</p>
              <p className="text-slate-900 dark:text-slate-100">{isUserLoading ? 'Loading...' : `+${displayUser.phoneNumber}`}</p>
            </div>
          ) : null}
          {isUserLoading || displayUser.gender ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Gender</p>
              <p className="text-slate-900 dark:text-slate-100">{isUserLoading ? 'Loading...' : displayUser.gender.charAt(0).toUpperCase() + displayUser.gender.slice(1)}</p>
            </div>
          ) : null}
          {isUserLoading || displayUser.barangay ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Barangay</p>
              <p className="text-slate-900 dark:text-slate-100">{isUserLoading ? 'Loading...' : displayUser.barangay}</p>
            </div>
          ) : null}
          {isUserLoading || displayUser.city ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">City</p>
              <p className="text-slate-900 dark:text-slate-100">{isUserLoading ? 'Loading...' : displayUser.city}</p>
            </div>
          ) : null}
          {isUserLoading || displayUser.province ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Province</p>
              <p className="text-slate-900 dark:text-slate-100">{isUserLoading ? 'Loading...' : displayUser.province}</p>
            </div>
          ) : null}
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Registered At</p>
            <p className="text-slate-900 font-numeric dark:text-slate-100">{displayUser.registeredAt}</p>
          </div>
        </div>
      </section>

      {/* Reports Submitted by User Section */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4 dark:border-slate-700/80 dark:bg-slate-800">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Reports Submitted by User</h2>
        
        {/* Filters Toolbar */}
        <UrgencyFilterChips
          chips={URGENCY_FILTER_CHIPS}
          selectedChip={selectedUrgency}
          onSelectChip={handleSelectUrgency}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
        />

        {isLoading ? (
          <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading user reports...</div>
        ) : reportsError ? (
          <div className="py-10 text-center text-sm text-red-500 dark:text-red-400">Failed to load reports.</div>
        ) : (
          <>
            <UrgencyFeedTable
              rows={visibleRows}
              onViewReport={onViewReport}
              isLoading={isFetching}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                visiblePages={visiblePages}
                onPageChange={handlePageChange}
                onNext={handleNextPage}
                onPrevious={handlePreviousPage}
              />
            )}
          </>
        )}
      </section>
    </main>
  )
}


