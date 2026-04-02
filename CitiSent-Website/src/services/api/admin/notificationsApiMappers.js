export function mapBackendNotification(payload = {}) {
  return {
    id: payload.id || '',
    title: payload.title || '',
    message: payload.message || '',
    type: payload.type || 'System',
    read: Boolean(payload.read),
    createdAt: payload.createdAt || '',
    reportId: payload.reportId || null,
    readAt: payload.readAt || null,
  }
}
