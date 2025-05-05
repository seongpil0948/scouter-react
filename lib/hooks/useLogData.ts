// lib/hooks/useLogData.ts
import { useState, useCallback, useEffect } from "react";
import { buildLogApiUrl } from "@/lib/utils/filterUtils";
import { useFilterStore } from "@/lib/store/telemetryStore";

export interface UseLogDataOptions {
  traceId?: string;
  hasTrace?: boolean;
  initialLimit?: number;
  autoRefresh?: boolean;
}

export function useLogData({
  traceId,
  hasTrace = false,
  initialLimit = 100,
  autoRefresh = false,
}: UseLogDataOptions = {}) {
  // State
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [services, setServices] = useState<string[]>([]);
  const [severities, setSeverities] = useState<string[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Get timeRange from global store
  const { timeRange, isRealtime } = useFilterStore();

  // Filters
  const [filters, setFilters] = useState<LogFilter>({
    startTime: timeRange.startTime,
    endTime: timeRange.endTime,
    serviceName: null,
    severity: null,
    hasTrace,
    query: traceId,
    limit: initialLimit,
    offset: 0,
  });

  // Fetch logs
  const fetchLogs = useCallback(
    async (force: boolean = false) => {
      if (isLoading && !force) return;

      try {
        setIsLoading(true);
        setIsValidating(true);

        // Update time range from global store
        const { startTime, endTime } = timeRange;
        const updatedFilters = { ...filters, startTime, endTime };

        // Calculate offset
        const offset = (currentPage - 1) * filters.limit;
        const apiUrl = buildLogApiUrl(
          traceId
            ? `${process.env.NEXT_PUBLIC_API_BASE_PATH}/telemetry/logs/trace/${traceId}`
            : `${process.env.NEXT_PUBLIC_API_BASE_PATH}/telemetry/logs`,
          updatedFilters,
          offset
        );

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error?.message || "Unknown error");
        }

        // Update state
        setLogs(data.data.logs || []);
        setTotalCount(data.data.pagination.total || 0);
        setServices(data.data.services || []);
        setSeverities(data.data.severities || []);
        setError(null);
      } catch (err) {
        console.error("[useLogData] Error fetching logs:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
        setIsValidating(false);
      }
    },
    [filters, currentPage, timeRange, traceId, isLoading]
  );

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<LogFilter>) => {
    setFilters((prevFilters) => ({ ...prevFilters, ...newFilters }));
    // Reset to first page when filters change
    setCurrentPage(1);
  }, []);

  // Effect: Initial load and when dependencies change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, currentPage, filters]);

  // Effect: Realtime updates
  useEffect(() => {
    if (!autoRefresh || !isRealtime) return;

    const interval = setInterval(() => {
      fetchLogs(true);
    }, 10000); // 10-second refresh

    return () => clearInterval(interval);
  }, [autoRefresh, isRealtime, fetchLogs]);

  return {
    logs,
    isLoading,
    isValidating,
    error,
    totalCount,
    currentPage,
    setCurrentPage,
    services,
    severities,
    filters,
    updateFilters,
    refresh: fetchLogs,
    selectedLogId,
    setSelectedLogId,
  };
}

export default useLogData;
