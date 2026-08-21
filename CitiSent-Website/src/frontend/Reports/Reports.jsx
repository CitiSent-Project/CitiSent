import { useCallback, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ByCategory } from './ByCategory'
import { ByUrgencyLevels } from './ByUrgencyLevels'
import { History } from './History'
import { canAdminUpdateReport, filterReportsForAdmin } from '../../controllers/reportAccessController'
import { notifyError, notifyErrorWithRetry } from '../../components/ui/toastHelpers'
import { reportsApiService } from '../../services/api/admin/reportsApiService'
import { mapBackendReportToUiRow } from '../../services/api/admin/reportsApiMappers'
import { loadFromStorageWithSchema } from '../../services/storageService'
import { ADMIN_STORAGE_KEYS, DEFAULT_PREFERENCES } from '../../models/data'
import { getStorageSchemaRule } from '../../models/storageSchemaModel'
import { useReportFeedRealtime } from '../../hooks/useReportFeedRealtime'

export function Reports({
  section = 'category',
  profile,
  preferences,
  departmentOptions = [],
  onViewReport,
  onUpdateStatus,
}) {
  const queryClient = useQueryClient()
  const schemaRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.accessToken)
  const accessToken = loadFromStorageWithSchema(
    ADMIN_STORAGE_KEYS.accessToken,
    '',
    {
      schemaVersion: schemaRule.schemaVersion,
      migrate: schemaRule.migrate,
      validate: schemaRule.validate,
    }
  )

  const reportsQuery = useQuery({
    queryKey: ['admin-reports', accessToken],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const response = await reportsApiService.listReports(accessToken, { limit: 1000, offset: 0 })
      return (response?.data || []).map(mapBackendReportToUiRow)
    },
    // Reports are refreshed by explicit user action or after a mutation.
    // Continuous polling caused every open Reports tab to make six requests
    // per minute and amplified traffic during backend failures.
    retry: false,
  })
  const reportsError = reportsQuery.error
  const refetchReports = reportsQuery.refetch

  // Real-time report feed: invalidate the admin-reports query when the
  // server signals a report has been created, updated, or deleted.
  const handleFeedInvalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-reports', accessToken] })
  }, [queryClient, accessToken])

  useReportFeedRealtime({
    accessToken,
    onInvalidate: handleFeedInvalidate,
    enabled: Boolean(accessToken),
  })

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, newStatus }) => {
      const currentRows = queryClient.getQueryData(['admin-reports', accessToken]) || []
      const report = currentRows.find((entry) => entry.id === reportId)

      if (!canAdminUpdateReport({ profile, report })) {
        throw new Error('You can only process reports assigned to your department.')
      }

      const result = await onUpdateStatus?.(reportId, newStatus)
      if (!result?.ok || !result.report) {
        throw new Error(result?.message || 'Unable to update report status.')
      }

      return {
        reportId,
        report: result.report,
      }
    },
    onMutate: async ({ reportId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-reports', accessToken] })

      const previousRows = queryClient.getQueryData(['admin-reports', accessToken]) || []
      queryClient.setQueryData(
        ['admin-reports', accessToken],
        previousRows.map((entry) =>
          entry.id === reportId ? { ...entry, status: newStatus } : entry
        )
      )

      return { previousRows }
    },
    onError: (error, _variables, context) => {
      if (context?.previousRows) {
        queryClient.setQueryData(['admin-reports', accessToken], context.previousRows)
      }

      notifyError('Status update denied.', error.message)
    },
    onSuccess: ({ reportId, report }) => {
      const currentRows = queryClient.getQueryData(['admin-reports', accessToken]) || []
      queryClient.setQueryData(
        ['admin-reports', accessToken],
        currentRows.map((entry) =>
          entry.id === reportId ? { ...entry, ...report } : entry
        )
      )
    },
  })

  useEffect(() => {
    if (reportsError) {
      notifyErrorWithRetry(
        'Reports unavailable.',
        reportsError.message,
        () => refetchReports()
      )
    }
  }, [refetchReports, reportsError])

  const rows = useMemo(() => reportsQuery.data || [], [reportsQuery.data])
  const loading = Boolean(accessToken) && (reportsQuery.isLoading || reportsQuery.isFetching)
  const reportsPerPage = preferences?.reportsPerPage ?? DEFAULT_PREFERENCES.reportsPerPage
  const defaultSorting = preferences?.defaultSorting ?? DEFAULT_PREFERENCES.defaultSorting

  const scopedRows = useMemo(() => filterReportsForAdmin({ rows, profile }), [rows, profile])

  async function handleUpdateStatus(reportId, newStatus) {
    try {
      const result = await updateReportMutation.mutateAsync({ reportId, newStatus })
      return {
        ok: true,
        report: result.report,
      }
    } catch {
      return { ok: false }
    }
  }

  if (section === 'history') {
    return (
      <History
        rows={scopedRows}
        departmentOptions={departmentOptions}
        onViewReport={onViewReport}
        onRefresh={refetchReports}
        isLoading={loading}
      />
    )
  }

  if (section === 'urgency') {
    return (
      <ByUrgencyLevels
        rows={scopedRows}
        profile={profile}
        reportsPerPage={reportsPerPage}
        defaultSorting={defaultSorting}
        onViewReport={onViewReport}
        onUpdateStatus={handleUpdateStatus}
        onRefresh={refetchReports}
        isLoading={loading}
      />
    )
  }

  return (
      <ByCategory
      rows={scopedRows}
      profile={profile}
      reportsPerPage={reportsPerPage}
      defaultSorting={defaultSorting}
      departmentOptions={departmentOptions}
      onViewReport={onViewReport}
        onUpdateStatus={handleUpdateStatus}
        onRefresh={refetchReports}
        isLoading={loading}
    />
  )
}
