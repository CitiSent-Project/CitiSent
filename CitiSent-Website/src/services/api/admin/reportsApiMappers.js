import { normalizeReportStatus } from '../../../models/reportStatusModel'
import { composeFullName } from '../../../models/nameModel'

const REPORT_STATUS_LABEL_MAP = {
  pending: 'Pending',
  in_review: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Unresolved',
}

function formatDate(value) {
  if (!value) {
    return 'Not available'
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })
}

function resolveDepartment(departmentId, departmentLabel, issueType) {
  const normalizedDepartmentId = String(departmentId || '').trim()
  const normalizedDepartmentLabel = String(departmentLabel || issueType || '').trim()

  return {
    id: normalizedDepartmentId || 'unassigned',
    label: normalizedDepartmentLabel || 'Unassigned',
  }
}

export function mapBackendReportToUiRow(payload = {}) {
  const department = resolveDepartment(
    payload.departmentId,
    payload.departmentLabel,
    payload.issueType
  )
  const dateValue = Date.parse(payload.createdAt || '')
  const reporter = payload.reporter || {}
  const reporterName =
    composeFullName({ fname: reporter.fname, mname: reporter.mname, lname: reporter.lname }) ||
    reporter.fullName ||
    ''

  return {
    id: payload.id || '',
    reportNum: payload.reportNumber || payload.id || '',
    reportNumber: payload.reportNumber || payload.id || '',
    userId: reporter.id || '',
    name: reporterName || 'Unknown Reporter',
    email: reporter.email || 'unknown@citisent.gov',
    location: payload.location || 'Not specified',
    date: formatDate(payload.createdAt),
    dateValue: Number.isNaN(dateValue) ? Date.now() : dateValue,
    categoryId: department.id,
    category: department.label,
    source: payload.source || 'Website',
    message: payload.description || '',
    urgency: payload.urgency || payload.sentimentLabel || 'Low',
    emotionLevel: payload.emotionLevel || 'Neutral',
    aiSummary: payload.aiSummary || null,
    status: normalizeReportStatus(
      REPORT_STATUS_LABEL_MAP[payload.status] || payload.statusLabel || payload.status
    ),
    issueType: payload.issueType || department.label,
    attachmentUrl: payload.attachmentUrl || null,
    backendStatus: payload.status || 'pending',
    createdAt: payload.createdAt || '',
    resolvedAt: payload.resolvedAt || payload.resolved_at || null,
    updatedAt: payload.updatedAt || '',
  }
}

export function mapUiStatusToBackendStatus(status) {
  const normalizedStatus = String(status || '').trim().toLowerCase()

  if (normalizedStatus === 'in progress') {
    return 'in_review'
  }

  if (normalizedStatus === 'unresolved') {
    return 'rejected'
  }

  if (normalizedStatus === 'resolved') {
    return 'resolved'
  }

  return 'pending'
}

export function mapBackendMessageToUi(payload = {}) {
  const sender = payload.sender || {}
  return {
    id: payload.id || '',
    senderId: payload.senderId || sender.id || '',
    senderName: payload.senderName || sender.fullName || sender.name || 'User',
    senderRole: String(payload.senderRole || payload.role || 'citizen').toLowerCase(),
    content: payload.content || payload.message || '',
    createdAt: payload.createdAt || payload.timestamp || '',
    isRead: Boolean(payload.isRead ?? payload.read),
    readAt: payload.readAt || null,
  }
}

export function mapBackendMessagesResponse(response) {
  const payload = Array.isArray(response) ? response : response?.data || []
  const rows = Array.isArray(payload) ? payload : [payload]
  return rows.map(mapBackendMessageToUi).sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

export function mapBackendSuggestionsToUi(response = {}) {
  const data = response?.data || response || {}
  return {
    suggestedReplies: (data.suggestedReplies || []).map((reply) => ({
      text: reply.text || "",
      rank: Number(reply.rank) || 0,
    })),
    tone: data.tone || "neutral",
    confidence: Number(data.confidence) || 0.5,
    reason: data.reason || "",
    triggerEmotion: data.triggerEmotion || "Neutral",
    fallbackMessage: data.fallbackMessage || "",
  }
}

/**
 * Maps a single backend conversation object into a UI-friendly shape.
 * Each conversation represents a report-based chat thread with a citizen.
 */
export function mapBackendConversationToUi(payload = {}) {
  const reporter = payload.reporter || payload.user || {}
  const lastMsg = payload.lastMessage || {}
  const reporterName =
    composeFullName({ fname: reporter.fname, mname: reporter.mname, lname: reporter.lname }) ||
    reporter.fullName ||
    reporter.name ||
    'Unknown User'

  return {
    reportId: payload.reportId || payload.id || '',
    reportNumber: payload.reportNumber || payload.reportNum || '',
    userId: reporter.id || payload.userId || '',
    userName: reporterName,
    userAvatar: reporter.avatar || reporter.avatarUrl || null,
    lastMessage: lastMsg.content || lastMsg.message || '',
    lastMessageAt: lastMsg.createdAt || lastMsg.timestamp || payload.updatedAt || '',
    lastMessageSenderRole: String(lastMsg.senderRole || lastMsg.role || '').toLowerCase(),
    unreadCount: Number(payload.unreadCount ?? payload.unread_count ?? 0),
    isOnline: Boolean(payload.isOnline ?? false),
    category: payload.category || payload.departmentLabel || payload.issueType || '',
    status: payload.status || 'pending',
    rawReport: payload,
  }
}

/**
 * Maps the backend response array of conversations into UI-friendly format.
 * Sorts conversations by most-recent message first.
 */
export function mapBackendConversationsResponse(response) {
  const data = response?.data || response || {}
  const payload = Array.isArray(data) ? data : data.rows || []
  const rows = Array.isArray(payload) ? payload : [payload]
  return rows
    .map(mapBackendConversationToUi)
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
}

