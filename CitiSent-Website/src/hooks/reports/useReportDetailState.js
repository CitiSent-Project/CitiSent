/**
 * useReportDetailState.js
 *
 * Manages all stateful logic for the ReportDetailPage:
 *  - Schema-backed access-token read
 *  - Unread chat count loading and cleanup safeguards
 *  - Admin-note suggestion loading and regeneration
 *  - Status selection, validation, save state, and cooldown lifecycle
 *  - Image modal, verification modal, and chat modal state
 *  - Timeline state and status-update transitions
 *
 * The hook keeps ReportDetailPage as a presentation-only component by
 * encapsulating all side effects (API calls, timers, storage reads)
 * and returning only derived state + event handlers.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { notifySuccess, notifyError } from '../../components/ui/toastHelpers'
import { normalizeReportStatus } from '../../models/reportStatusModel'
import {
  createReportTimelineEntry,
  validateReportStatusChange,
} from '../../controllers/reports/reportStatusController'
import { canAdminUpdateReport } from '../../controllers/reports/reportAccessController'
import { reportsApiService } from '../../services/api/admin/reportsApiService'
import {
  mapBackendAdminNoteSuggestionsToUi,
  mapBackendMessagesResponse,
  mapUiStatusToBackendStatus,
} from '../../services/api/admin/reportsApiMappers'
import { loadFromStorageWithSchema } from '../../services/storageService'
import { ADMIN_STORAGE_KEYS } from '../../models/data'
import { getStorageSchemaRule } from '../../models/storageSchemaModel'

/**
 * @param {object}   params
 * @param {object}   params.report           - The report data object (or null when missing).
 * @param {object}   params.profile          - Current admin profile.
 * @param {Function} params.onUpdateStatus   - Callback to persist a status change via the orchestrator.
 */
export function useReportDetailState({ report, profile, onUpdateStatus }) {
  // ---------------------------------------------------------------------------
  // Access token: read from schema-backed storage (same as the original
  // ReportDetailPage inline read). This avoids threading the token through
  // props/context solely for the detail page.
  // ---------------------------------------------------------------------------
  const accessTokenRule = getStorageSchemaRule(ADMIN_STORAGE_KEYS.accessToken)
  const accessToken = loadFromStorageWithSchema(ADMIN_STORAGE_KEYS.accessToken, '', accessTokenRule)

  // ---------------------------------------------------------------------------
  // Core state
  // ---------------------------------------------------------------------------
  const [adminNotes, setAdminNotes] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(() => normalizeReportStatus(report?.status))
  const [isSaving, setIsSaving] = useState(false)
  const [isCooldown, setIsCooldown] = useState(false)
  const cooldownTimerRef = useRef(null)

  // ---------------------------------------------------------------------------
  // Modal state
  // ---------------------------------------------------------------------------
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)
  const [pendingValidation, setPendingValidation] = useState(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  // ---------------------------------------------------------------------------
  // Full Report Fetching (Triggers Audit Log & Resolves Data Minimization)
  // ---------------------------------------------------------------------------
  const [fullReport, setFullReport] = useState(report || null)
  const [isFetchingFullReport, setIsFetchingFullReport] = useState(false)

  useEffect(() => {
    if (!report?.id || !accessToken) return
    let isMounted = true

    setIsFetchingFullReport(true)
    reportsApiService.getReportById(accessToken, report.id)
      .then((res) => {
        if (isMounted && res.data) {
          // Merge minimal list data with fetched full details
          setFullReport((prev) => ({ ...prev, ...res.data }))
        }
      })
      .catch((err) => console.error('Failed to fetch full report details:', err))
      .finally(() => {
        if (isMounted) setIsFetchingFullReport(false)
      })

    return () => { isMounted = false }
  }, [report?.id, accessToken])

  // ---------------------------------------------------------------------------
  // Admin note suggestions (AI copilot)
  // ---------------------------------------------------------------------------
  const [adminNoteSuggestions, setAdminNoteSuggestions] = useState([])
  const [isAdminNoteSuggestionsLoading, setIsAdminNoteSuggestionsLoading] = useState(false)

  // ---------------------------------------------------------------------------
  // Timeline
  // ---------------------------------------------------------------------------
  const [timeline, setTimeline] = useState(() => [
    {
      id: 1,
      action: 'Report Submitted',
      status: 'Pending',
      note: 'Report was submitted by the citizen.',
      date: report?.date || 'N/A',
      actor: report?.name || 'Citizen',
    },
  ])

  // ---------------------------------------------------------------------------
  // Unread chat count
  // ---------------------------------------------------------------------------
  const [unreadChatCount, setUnreadChatCount] = useState(0)

  // Load unread chat count on mount (when report and token are available).
  useEffect(() => {
    if (!report?.id || !accessToken) return
    let isMounted = true
    reportsApiService.listReportMessages(accessToken, report.id)
      .then((res) => {
        const msgs = mapBackendMessagesResponse(res)
        const unread = msgs.filter((m) => m.senderRole !== 'admin' && !m.isRead).length
        if (isMounted) setUnreadChatCount(unread)
      })
      .catch(() => {})
    return () => { isMounted = false }
  }, [report?.id, accessToken])

  // ---------------------------------------------------------------------------
  // Admin note suggestions: load on mount and when selectedStatus changes.
  // ---------------------------------------------------------------------------
  const loadAdminNoteSuggestions = useCallback(async (forceRegenerate = false) => {
    if (!report?.id || !accessToken) return

    setIsAdminNoteSuggestionsLoading(true)
    try {
      const response = await reportsApiService.getReportAdminNoteSuggestions(
        accessToken,
        report.id,
        mapUiStatusToBackendStatus(selectedStatus),
        forceRegenerate,
      )
      const mapped = mapBackendAdminNoteSuggestionsToUi(response)
      setAdminNoteSuggestions(mapped.suggestedNotes || [])
    } catch {
      // The backend normally returns status-specific fallbacks. Keep the note field usable if it is unavailable.
      setAdminNoteSuggestions([])
    } finally {
      setIsAdminNoteSuggestionsLoading(false)
    }
  }, [accessToken, report?.id, selectedStatus])

  useEffect(() => {
    loadAdminNoteSuggestions()
  }, [loadAdminNoteSuggestions])

  // ---------------------------------------------------------------------------
  // Cooldown timer cleanup on unmount.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        window.clearTimeout(cooldownTimerRef.current)
        cooldownTimerRef.current = null
      }
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const currentStatus = normalizeReportStatus(fullReport?.status)

  // A report marked as Rejected or Resolved is permanently locked.
  const isPermanentlyLocked = currentStatus === 'Rejected' || currentStatus === 'Resolved'
  const canProcessReport = canAdminUpdateReport({ profile, report: fullReport }) && !isPermanentlyLocked
  const canChat = canAdminUpdateReport({ profile, report: fullReport })
  const isSaveDisabled =
    !canProcessReport || selectedStatus === currentStatus || isSaving || isCooldown || isPermanentlyLocked

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------
  function startCooldown() {
    if (cooldownTimerRef.current) {
      window.clearTimeout(cooldownTimerRef.current)
    }

    setIsCooldown(true)
    cooldownTimerRef.current = window.setTimeout(() => {
      setIsCooldown(false)
      cooldownTimerRef.current = null
    }, 1000)
  }

  // ---------------------------------------------------------------------------
  // Status save: validates, optionally shows verification modal, then executes.
  // ---------------------------------------------------------------------------
  async function handleStatusSave() {
    if (isSaving || isCooldown || isPermanentlyLocked) {
      return
    }

    if (!canProcessReport) {
      notifyError('Status update denied.', 'You can only process reports assigned to your department.')
      return
    }

    if (selectedStatus === currentStatus) {
      return
    }

    const validation = validateReportStatusChange({
      currentStatus,
      nextStatus: selectedStatus,
      adminNotes,
    })

    if (!validation.ok) {
      notifyError(validation.title, validation.message)
      return
    }

    // Intercept if marking as Rejected or Resolved to show verification modal
    if (validation.nextStatus === 'Rejected' || validation.nextStatus === 'Resolved') {
      setPendingValidation(validation)
      setIsVerificationModalOpen(true)
      return
    }

    // Otherwise, proceed to save immediately
    await executeStatusSave(validation)
  }

  async function executeStatusSave(validation) {
    startCooldown()
    setIsSaving(true)

    try {
      const result = await onUpdateStatus(report.id, validation.nextStatus, adminNotes)
      if (!result?.ok) {
        return
      }

      setTimeline((previous) => [
        ...previous,
        {
          id: previous.length + 1,
          ...createReportTimelineEntry({
            nextStatus: validation.nextStatus,
            adminNotes,
          }),
        },
      ])

      notifySuccess(`Report ${report.id} marked as ${validation.nextStatus}.`)
      setAdminNotes('')
      setSelectedStatus(validation.nextStatus)

      // Clear modal state on success
      setIsVerificationModalOpen(false)
      setPendingValidation(null)
    } finally {
      setIsSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Chat modal helpers
  // ---------------------------------------------------------------------------
  function handleOpenChat() {
    setIsChatOpen(true)
    setUnreadChatCount(0)
  }

  function handleCloseChat() {
    setIsChatOpen(false)
  }

  function handleCloseVerification() {
    setIsVerificationModalOpen(false)
    setPendingValidation(null)
  }

  // ---------------------------------------------------------------------------
  // Public API returned to the presentation component.
  // ---------------------------------------------------------------------------
  return {
    // State values
    accessToken,
    adminNotes,
    selectedStatus,
    isSaving,
    isCooldown,
    isImageModalOpen,
    isVerificationModalOpen,
    pendingValidation,
    isChatOpen,
    adminNoteSuggestions,
    isAdminNoteSuggestionsLoading,
    timeline,
    unreadChatCount,
    fullReport,
    isFetchingFullReport,

    // Derived values
    currentStatus,
    isPermanentlyLocked,
    canProcessReport,
    canChat,
    isSaveDisabled,

    // Setters (for simple inline state changes in the UI)
    setAdminNotes,
    setSelectedStatus,
    setIsImageModalOpen,

    // Actions
    handleStatusSave,
    executeStatusSave,
    handleOpenChat,
    handleCloseChat,
    handleCloseVerification,
    loadAdminNoteSuggestions,
  }
}
