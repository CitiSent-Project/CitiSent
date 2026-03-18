import { useMemo, useState } from 'react'
import { urgencyFeedRows as initialRows } from '../Data/reportsData'
import { ByCategory } from './ByCategory'
import { ByUrgencyLevels } from './ByUrgencyLevels'
import {initializeReportRows, updateReportStatusInRows,} from '../../controllers/reportStatusController'
import { canAdminUpdateReport, filterReportsForAdmin } from '../../controllers/reportAccessController'
import { notifyError } from '../../components/ui/toastHelpers'

export function Reports({ section = 'category', profile, onViewReport }) {
  const [rows, setRows] = useState(() => initializeReportRows(initialRows))
  const scopedRows = useMemo(() => filterReportsForAdmin({ rows, profile }), [rows, profile])

  function handleUpdateStatus(reportId, newStatus) {
    const report = rows.find((entry) => entry.id === reportId)
    if (!canAdminUpdateReport({ profile, report })) {
      notifyError('Status update denied.', 'You can only process reports assigned to your department.')
      return
    }

    setRows((prev) => updateReportStatusInRows(prev, reportId, newStatus))
  }

  if (section === 'urgency') {
    return (
      <ByUrgencyLevels
        rows={scopedRows}
        profile={profile}
        onViewReport={onViewReport}
        onUpdateStatus={handleUpdateStatus}
      />
    )
  }

  return (
    <ByCategory
      rows={scopedRows}
      profile={profile}
      onViewReport={onViewReport}
      onUpdateStatus={handleUpdateStatus}
    />
  )
}