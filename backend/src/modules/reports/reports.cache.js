const reportsUserPrefix = "reports:user:";

export function buildReportsListCacheKey({ userId, limit, offset, status }) {
  const normalizedStatus = status ?? "all";

  return `${reportsUserPrefix}${userId}:list:limit:${limit}:offset:${offset}:status:${normalizedStatus}`;
}

export function buildReportsCountsCacheKey(userId) {
  return `${reportsUserPrefix}${userId}:counts`;
}

export function buildReportsUnreadSummaryCacheKey(userId) {
  return `${reportsUserPrefix}${userId}:unread_summary`;
}

export function buildReportsUserCachePrefix(userId) {
  return `${reportsUserPrefix}${userId}:`;
}


