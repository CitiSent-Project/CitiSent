export function mapBackendActivityLogEntry(payload = {}) {
  return {
    id: payload.id || '',
    action: payload.action || 'Activity',
    detail: payload.detail || '',
    createdAt: payload.createdAt || payload.created_at || new Date().toISOString(),
  }
}
