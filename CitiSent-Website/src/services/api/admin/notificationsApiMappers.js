export function mapBackendNotification(payload = {}) {
  return {
    id: payload.id || '',
    title: payload.title || '',
    message: payload.message || '',
    type: payload.type || 'System',
    read: Boolean(payload.read),
    createdAt: payload.createdAt || payload.created_at || '',
    reportId: payload.reportId || payload.report_id || null,
    readAt: payload.readAt || payload.read_at || null,
    metadata: payload.metadata || null,
  }
}
