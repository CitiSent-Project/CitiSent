import { useCallback, useEffect, useState } from "react";
import { reportsApi } from "../services/reports";

export default function useMyReports(statusFilter = "all") {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  const fetchMyReports = useCallback(async (currentOffset, currentLimit) => {
    const res = await reportsApi.getMyReports(currentLimit, currentOffset, statusFilter);
    return res || { data: [], total: 0 };
  }, [statusFilter]);

  const loadFirstPage = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const res = await fetchMyReports(0, LIMIT);
      setReports(res.data);
      setTotal(res.total);
      setOffset(0);
    } finally {
      setIsInitialLoading(false);
    }
  }, [fetchMyReports]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || reports.length >= total) return;
    setIsLoadingMore(true);
    try {
      const nextOffset = offset + LIMIT;
      const res = await fetchMyReports(nextOffset, LIMIT);
      setReports((prev) => [...prev, ...res.data]);
      setTotal(res.total);
      setOffset(nextOffset);
    } finally {
      setIsLoadingMore(false);
    }
  }, [offset, reports.length, total, fetchMyReports, isLoadingMore]);

  const reloadMyReports = useCallback(async () => {
    await loadFirstPage();
  }, [loadFirstPage]);

  const hasMore = reports.length < total;

  return {
    reports,
    total,
    reloadMyReports,
    isInitialLoading,
    isLoadingMore,
    hasMore,
    loadMore,
  };
}
