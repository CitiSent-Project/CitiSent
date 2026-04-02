export function mapBackendActivityLogEntry(payload = {}) {
  return {
    id: payload.id || '',
    action: payload.action || 'Activity',
    detail: payload.detail || '',
    createdAt: payload.createdAt || new Date().toISOString(),
  }
}
