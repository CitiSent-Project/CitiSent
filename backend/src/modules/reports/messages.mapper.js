/**
 * Maps a report_messages DB row to the API response shape.
 *
 * @param {object} row       - The raw DB row (may include report_message_reads join array).
 * @param {string} [readerId] - The authenticated user's ID. When provided, `isRead` is
 *                              resolved from the per-user `report_message_reads` join record
 *                              instead of the (non-existent) `is_read` column on the message
 *                              row itself, which always returned false.
 */
export function toReportMessageResponse(row, readerId = null) {
  // `report_message_reads` is a left-joined array from Supabase.
  // Find the entry that belongs to the current reader (citizen opening the chat).
  const reads = Array.isArray(row.report_message_reads) ? row.report_message_reads : [];
  let isRead = false;

  if (readerId) {
    const readerEntry = reads.find((r) => String(r.user_id) === String(readerId));
    isRead = Boolean(readerEntry?.is_read);
  } else if (reads.length > 0) {
    // Fallback: any read entry marks this message as read
    isRead = reads.some((r) => Boolean(r.is_read));
  }

  return {
    id: row.id,
    reportId: row.report_id,
    senderId: row.sender_id,
    message: row.message,
    isRead,
    readAt: reads.find((r) => r.read_at)?.read_at ?? row.read_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
