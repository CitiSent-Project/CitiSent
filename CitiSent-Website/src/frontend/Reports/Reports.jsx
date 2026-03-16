import { useState } from 'react'
import { urgencyFeedRows as initialRows } from '../Data/reportsData'
import { ByCategory } from './ByCategory'
import { ByUrgencyLevels } from './ByUrgencyLevels'
import {initializeReportRows, updateReportStatusInRows,} from '../../controllers/reportStatusController'

export function Reports({ section = 'category', onViewReport }) {
  const [rows, setRows] = useState(() => initializeReportRows(initialRows))

  function handleUpdateStatus(reportId, newStatus) {
    setRows((prev) => updateReportStatusInRows(prev, reportId, newStatus))
  }

  if (section === 'urgency') {
    return (
      <ByUrgencyLevels
        rows={rows}
        onViewReport={onViewReport}
        onUpdateStatus={handleUpdateStatus}
      />
    )
  }

  return (
    <ByCategory
      rows={rows}
      onViewReport={onViewReport}
      onUpdateStatus={handleUpdateStatus}
    />
  )
}