import { useEffect, useState } from 'react'
import { reportsApiService } from '../../services/api/admin/reportsApiService'
import {
  mapBackendReportToUiRow,
  mapUiStatusToBackendStatus,
} from '../../services/api/admin/reportsApiMappers'
import {
  buildNextReportStatusMap,
  buildNextSelectedReport,
} from '../../controllers/reports/reportStateController'
import { APP_PAGES } from '../../models/pageModel'

/**
 * Custom hook to manage report-related state and actions, 
 * including hydrating individual report details and updating status.
 */
export function useReportManagementState({
  accessToken,
  activePage,
  selectedReportId,
  selectedReport,
  setActivePage,
  setSelectedReportId,
  setSelectedReport,
  setIsPageLoading,
  notifyError,
}) {
  const [reportStatusMap, setReportStatusMap] = useState({})

  useEffect(() => {
    let isMounted = true

    async function hydrateSelectedReport() {
      if (
        activePage === APP_PAGES.REPORT_DETAIL &&
        !selectedReport &&
        selectedReportId &&
        accessToken
      ) {
        setIsPageLoading(true)
        try {
          const response = await reportsApiService.getReportById(accessToken, selectedReportId)
          if (isMounted && response?.data) {
            const mappedReport = mapBackendReportToUiRow(response.data)
            // Apply the viewed status adjustment if needed, similar to handleViewReport
            const mappedStatus = reportStatusMap[mappedReport.id] || mappedReport.status
            setSelectedReport({
              ...mappedReport,
              status: mappedStatus,
            })
          }
        } catch (error) {
          if (isMounted) {
            notifyError('Failed to load report.', error.message)
            setActivePage(APP_PAGES.REPORTS_BY_CATEGORY)
            setSelectedReportId('')
          }
        } finally {
          if (isMounted) {
            setIsPageLoading(false)
          }
        }
      }
    }

    hydrateSelectedReport()

    return () => {
      isMounted = false
    }
  }, [activePage, selectedReportId, accessToken, selectedReport, reportStatusMap, notifyError, setActivePage, setSelectedReportId, setIsPageLoading, setSelectedReport])

  async function handleReportStatusUpdate(reportId, newStatus, adminMessage) {
    if (!accessToken) {
      const message = 'Your session has expired. Please sign in again.'
      notifyError('Status update failed.', message)
      return { ok: false, message }
    }

    try {
      const response = await reportsApiService.updateReport(accessToken, reportId, {
        status: mapUiStatusToBackendStatus(newStatus),
        adminMessage,
      })
      const updatedReport = mapBackendReportToUiRow(response?.data)

      setReportStatusMap((prevMap) =>
        buildNextReportStatusMap({
          reportStatusMap: prevMap,
          reportId,
          nextStatus: updatedReport.status,
        })
      )
      setSelectedReport((prevSelectedReport) => {
        const nextSelectedReport = buildNextSelectedReport({
          selectedReport: prevSelectedReport,
          reportId,
          nextStatus: updatedReport.status,
        })

        return nextSelectedReport && nextSelectedReport.id === updatedReport.id
          ? { ...nextSelectedReport, ...updatedReport }
          : nextSelectedReport
      })

      return { ok: true, report: updatedReport }
    } catch (error) {
      notifyError('Status update failed.', error.message)
      return { ok: false, message: error.message }
    }
  }

  return {
    reportStatusMap,
    setReportStatusMap,
    handleReportStatusUpdate,
  }
}
