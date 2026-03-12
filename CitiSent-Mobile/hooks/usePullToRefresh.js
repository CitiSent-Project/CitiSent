import { useCallback, useEffect, useRef, useState } from "react";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function usePullToRefresh(onRefreshWork, options = {}) {
  const { minSpinnerDuration = 650 } = options;
  const [refreshing, setRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([Promise.resolve(onRefreshWork?.()), wait(minSpinnerDuration)]);
    } catch (error) {
      // Keep refresh resilient even if downstream reload logic fails.
      console.warn("Pull-to-refresh failed:", error);
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [minSpinnerDuration, onRefreshWork]);

  return {
    refreshing,
    onRefresh,
  };
}
