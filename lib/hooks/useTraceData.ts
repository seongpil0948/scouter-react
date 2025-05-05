// lib/hooks/useTraceData.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useFilterStore } from "@/lib/store/telemetryStore";
import { useTraceFilterStore } from "@/lib/store/traceFilterStore";
import { useTraceDataStore } from "@/lib/store/traceDataStore";

// Options type for useTraceData hook
export interface UseTraceDataOptions {
  rootSpansOnly?: boolean;
  initialOffset?: number;
  autoRefresh?: boolean;
}

/**
 * Enhanced custom hook for fetching and managing trace data
 * - Connects multiple stores for coordinated state management
 * - Handles realtime updates
 * - Provides data loading states
 */
export function useTraceData({
  rootSpansOnly = true,
  initialOffset = 0,
  autoRefresh = false,
}: UseTraceDataOptions = {}) {
  // Get store states and actions
  const {
    data: traces,
    totalCount,
    status,
    error,
    isValidating,
    currentPage,
    lastFetched,
    setCurrentPage: setStorePage,
    fetchTraces,
  } = useTraceDataStore();

  const {
    timeRange,
    isRealtime,
    toggleRealtime,
    refreshInterval,
    setRefreshInterval,
    realtimeRange,
    setRealtimeRange,
    setTimeRange,
  } = useFilterStore();

  const { triggerRefresh: triggerFilterRefresh } = useTraceFilterStore();

  // Local state
  const { selectedTraceId, setSelectedTraceId } = useTraceDataStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Get loading state
  const isLoading = status === "loading";

  // Initialize the hook
  useEffect(() => {
    if (!isInitialized) {
      // Initializing hook

      // Set root spans only filter if needed
      if (rootSpansOnly !== undefined) {
        useTraceFilterStore.getState().setRootSpansOnly(rootSpansOnly);
      }

      // Initial fetch of data
      fetchTraces();

      // Start realtime updates if enabled
      if (isRealtime) {
        startRealtimeUpdates();
      }

      setIsInitialized(true);
    }

    // Cleanup function
    return () => {
      stopRealtimeUpdates();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle realtime updates
  useEffect(() => {
    if (isRealtime) {
      startRealtimeUpdates();
    } else {
      stopRealtimeUpdates();
    }

    return () => stopRealtimeUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRealtime, refreshInterval]);

  // Start realtime updates
  const startRealtimeUpdates = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // Set up interval for realtime updates
    if (isRealtime && refreshInterval > 0) {
      // Starting realtime updates

      refreshTimerRef.current = setInterval(() => {
        if (!isRefreshingRef.current) {
          isRefreshingRef.current = true;

          // Update time range for realtime
          const now = Date.now();
          const rangeInMs = realtimeRange * 60 * 1000;
          setTimeRange(now - rangeInMs, now);

          // Fetch new data
          fetchTraces(true).finally(() => {
            isRefreshingRef.current = false;
          });
        }
      }, refreshInterval * 1000);
    }
  }, [isRealtime, refreshInterval, realtimeRange, setTimeRange, fetchTraces]);

  // Stop realtime updates
  const stopRealtimeUpdates = useCallback(() => {
    if (refreshTimerRef.current) {
      // Stopping realtime updates
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      // Refresh already in progress, skipping
      return;
    }

    // Manual refresh triggered
    isRefreshingRef.current = true;

    try {
      // Trigger filter refresh to update lastRefreshed timestamp
      triggerFilterRefresh();

      // Update time range if in realtime mode
      if (isRealtime) {
        const now = Date.now();
        const rangeInMs = realtimeRange * 60 * 1000;
        setTimeRange(now - rangeInMs, now);
      }

      // Fetch new data
      await fetchTraces(true);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [
    fetchTraces,
    isRealtime,
    realtimeRange,
    setTimeRange,
    triggerFilterRefresh,
  ]);

  // Set current page with validation
  const setCurrentPage = useCallback(
    (page: number) => {
      if (page < 1) page = 1;
      setStorePage(page);
    },
    [setStorePage]
  );

  // Return combined state and actions
  return {
    // Data
    traces,
    data: { traces, total: totalCount }, // For backward compatibility

    // Status
    error,
    isLoading,
    isValidating,

    // Pagination
    currentPage,
    totalCount,
    setCurrentPage,

    // Time range
    timeRange,

    // Realtime mode
    isRealtime,
    toggleRealtime,
    refreshInterval,
    setRefreshInterval,
    realtimeRange,
    setRealtimeRange,

    // Actions
    refresh,
    refreshData: refresh, // Alias for backward compatibility

    // Metadata
    lastFetched,
    selectedTraceId,
    setSelectedTraceId,
  };
}

export default useTraceData;
