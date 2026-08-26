import { DEFAULT_TRANSFER_REQUESTS } from '../data'
import { asArray, asString, isObject } from './valueNormalizers'

export function normalizeTransferRequest(entry) {
  const source = isObject(entry) ? entry : {}

  return {
    ...source,
    id: asString(source.id, `transfer-${Date.now()}`),
    adminId: asString(source.adminId),
    adminName: asString(source.adminName),
    currentDepartmentId: asString(source.currentDepartmentId),
    currentDepartmentLabel: asString(source.currentDepartmentLabel),
    requestedDepartmentId: asString(source.requestedDepartmentId),
    requestedDepartmentLabel: asString(source.requestedDepartmentLabel),
    reason: asString(source.reason),
    status: asString(source.status, 'pending'),
    requestedAt: asString(source.requestedAt, new Date().toISOString()),
    reviewedAt: asString(source.reviewedAt, ''),
    reviewerId: asString(source.reviewerId, ''),
    reviewerName: asString(source.reviewerName, ''),
    reviewNotes: asString(source.reviewNotes, ''),
  }
}

export function normalizeTransferRequests(transferRequests) {
  const normalized = asArray(transferRequests, []).map(normalizeTransferRequest)
  return normalized.length > 0 ? normalized : DEFAULT_TRANSFER_REQUESTS
}

export function normalizeActivityEntry(entry) {
  const source = isObject(entry) ? entry : {}

  return {
    id: asString(source.id, `activity-${Date.now()}`),
    action: asString(source.action, 'Activity'),
    detail: asString(source.detail, ''),
    createdAt: asString(source.createdAt, new Date().toISOString()),
  }
}

export function normalizeActivityLog(activityLog) {
  return asArray(activityLog, []).map(normalizeActivityEntry)
}
