const reportsCacheKeyPrefix = "reports:list:user:";

export function buildReportsListCacheKey({ userId, limit, offset, status }) {
  const normalizedStatus = status ?? "all";

  return `${reportsCacheKeyPrefix}${userId}:limit:${limit}:offset:${offset}:status:${normalizedStatus}`;
}

export function buildReportsUserCachePrefix(userId) {
  return `${reportsCacheKeyPrefix}${userId}:`;
}
