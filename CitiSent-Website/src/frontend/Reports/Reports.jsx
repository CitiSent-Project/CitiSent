import { useState } from 'react'
import { urgencyFeedRows as initialRows } from '../Data/reportsData'
import { ByCategory } from './ByCategory'
import { ByUrgencyLevels } from './ByUrgencyLevels'

export function Reports({ section = 'category', onViewReport }) {
  const [rows, setRows] = useState(() =>
    initialRows.map((r) => ({ ...r, status: r.status || 'Pending' }))
  )

  function handleUpdateStatus(reportId, newStatus) {
    setRows((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
    )
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