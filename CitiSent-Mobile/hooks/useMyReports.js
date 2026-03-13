import { useCallback, useEffect, useMemo, useState } from "react";
import { reportsApi } from "../services/reports";

const ALL_STATUS = "all";

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export default function useMyReports() {
  const [reports, setReports] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(ALL_STATUS);
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
    setSelectedStatus(ALL_STATUS);
    const nextReports = await fetchMyReports();
    setReports(nextReports);
  }, [fetchMyReports]);

  const filteredReports = useMemo(() => {
    if (selectedStatus === ALL_STATUS) {
      return reports;
    }

    return reports.filter(
      (report) => normalizeStatus(report.status) === selectedStatus,
    );
  }, [reports, selectedStatus]);

  return {
    selectedStatus,
    setSelectedStatus,
    filteredReports,
    reloadMyReports,
    isInitialLoading,
  };
}
