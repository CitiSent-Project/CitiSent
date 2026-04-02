import { useEffect, useMemo, useState } from 'react'
import { ByCategory } from './ByCategory'
import { ByUrgencyLevels } from './ByUrgencyLevels'
import { canAdminUpdateReport, filterReportsForAdmin } from '../../controllers/reportAccessController'
import { notifyError } from '../../components/ui/toastHelpers'
import { reportsApiService } from '../../services/api/admin/reportsApiService'
import { mapBackendReportToUiRow } from '../../services/api/admin/reportsApiMappers'
import { loadFromStorageWithSchema } from '../../services/storageService'
import { ADMIN_STORAGE_KEYS } from '../../models/data'
import { getStorageSchemaRule } from '../../models/storageSchemaModel'

export function Reports({
  section = 'category',
  profile,
  departmentOptions = [],
  onViewReport,
  onUpdateStatus,
}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    async function loadReports() {
      setLoading(true)

      try {
        const schemaRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.accessToken)
        const parsedToken = loadFromStorageWithSchema(
          ADMIN_STORAGE_KEYS.accessToken,
          '',
          {
            schemaVersion: schemaRule.schemaVersion,
            migrate: schemaRule.migrate,
            validate: schemaRule.validate,
          }
        )
        const response = await reportsApiService.listReports(parsedToken, { limit: 100, offset: 0 })

        if (isCancelled) {
          return
        }

        setRows((response?.data || []).map(mapBackendReportToUiRow))
      } catch (error) {
        if (!isCancelled) {
          notifyError('Reports unavailable.', error.message)
          setRows([])
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadReports()

    return () => {
      isCancelled = true
    }
  }, [])

  const scopedRows = useMemo(() => filterReportsForAdmin({ rows, profile }), [rows, profile])

  async function handleUpdateStatus(reportId, newStatus) {
    const report = rows.find((entry) => entry.id === reportId)
    if (!canAdminUpdateReport({ profile, report })) {
      notifyError('Status update denied.', 'You can only process reports assigned to your department.')
      return { ok: false }
    }

    const result = await onUpdateStatus?.(reportId, newStatus)
    if (!result?.ok || !result.report) {
      return result || { ok: false }
    }

    setRows((previousRows) =>
      previousRows.map((entry) => (entry.id === reportId ? { ...entry, ...result.report } : entry))
    )

    return result
  }

  if (section === 'urgency') {
    return (
      <ByUrgencyLevels
        rows={scopedRows}
        profile={profile}
        onViewReport={onViewReport}
        onUpdateStatus={handleUpdateStatus}
        isLoading={loading}
      />
    )
  }

  return (
    <ByCategory
      rows={scopedRows}
      profile={profile}
      departmentOptions={departmentOptions}
      onViewReport={onViewReport}
      onUpdateStatus={handleUpdateStatus}
      isLoading={loading}
    />
  )
}
