import { useCallback, useEffect, useState } from "react";
import { reportsApi } from "../services/reports";

export default function useMyReports() {
  const [reports, setReports] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchMyReports = useCallback(async () => {
    const nextReports = await reportsApi.getMyReports();
    return Array.isArray(nextReports) ? nextReports : [];
  }, []);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsInitialLoading(true);

      try {
        const nextReports = await fetchMyReports();

        if (isActive) {
          setReports(nextReports);
        }
      } finally {
        if (isActive) {
          setIsInitialLoading(false);
        }
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [fetchMyReports]);

  const reloadMyReports = useCallback(async () => {
    const nextReports = await fetchMyReports();
    setReports(nextReports);
  }, [fetchMyReports]);

  return {
    reports,
    reloadMyReports,
    isInitialLoading,
  };
}
