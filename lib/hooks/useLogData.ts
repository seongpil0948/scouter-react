import { useCallback, useEffect, useRef, useState } from "react";
import { useFilterStore } from "@/lib/store/telemetryStore";
import { useLogDataStore } from "@/lib/store/logDataStore";

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
  // 스토어 상태와 액션 가져오기
  const {
    logs,
    totalCount,
    services,
    severities,
    status,
    error,
    isValidating,
    currentPage,
    searchQuery,
    selectedService,
    selectedSeverity,
    hasTrace: storeHasTrace,
    limit,
    setCurrentPage: setStorePage,
    setSearchQuery,
    setSelectedService,
    setSelectedSeverity,
    setHasTrace,
    setLimit,
    fetchLogs,
    selectedLogId,
    setSelectedLogId,
  } = useLogDataStore();

  const { timeRange, isRealtime, toggleRealtime, refreshInterval } =
    useFilterStore();

  // 로컬 상태
  const [isInitialized, setIsInitialized] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // 필터 통합
  const filters = {
    startTime: timeRange.startTime,
    endTime: timeRange.endTime,
    serviceName: selectedService,
    severity: selectedSeverity,
    hasTrace: storeHasTrace,
    query: searchQuery,
    limit,
    offset: (currentPage - 1) * limit,
  };

  // 필터 업데이트 함수
  const updateFilters = useCallback(
    (newFilters: Partial<LogFilter>) => {
      if (newFilters.query !== undefined) {
        setSearchQuery(newFilters.query);
      }
      if (newFilters.serviceName !== undefined) {
        setSelectedService(newFilters.serviceName);
      }
      if (newFilters.severity !== undefined) {
        setSelectedSeverity(newFilters.severity);
      }
      if (newFilters.hasTrace !== undefined) {
        setHasTrace(newFilters.hasTrace);
      }
      if (newFilters.limit !== undefined) {
        setLimit(newFilters.limit);
      }

      // 필터가 변경되면 첫 페이지로 이동
      setStorePage(1);
    },
    [
      setSearchQuery,
      setSelectedService,
      setSelectedSeverity,
      setHasTrace,
      setLimit,
      setStorePage,
    ]
  );

  // 로딩 상태 확인
  const isLoading = status === "loading";

  // 초기화
  useEffect(() => {
    if (!isInitialized) {
      // 옵션 기반 초기 필터 설정
      if (traceId) {
        setSearchQuery(traceId);
      }
      if (hasTrace !== undefined) {
        setHasTrace(hasTrace);
      }
      if (initialLimit !== undefined) {
        setLimit(initialLimit);
      }

      // 초기 데이터 가져오기
      fetchLogs();

      // 실시간 모드가 활성화된 경우 업데이트 시작
      if (isRealtime && autoRefresh) {
        startRealtimeUpdates();
      }

      setIsInitialized(true);
    }

    // 정리 함수
    return () => {
      stopRealtimeUpdates();
    };
  }, []);

  // 실시간 모드 처리
  useEffect(() => {
    if (isRealtime && autoRefresh) {
      startRealtimeUpdates();
    } else {
      stopRealtimeUpdates();
    }

    return () => stopRealtimeUpdates();
  }, [isRealtime, refreshInterval, autoRefresh]);

  // 실시간 업데이트 시작
  const startRealtimeUpdates = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // 실시간 업데이트 인터벌 설정
    if (isRealtime && refreshInterval > 0 && autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        if (!isRefreshingRef.current) {
          isRefreshingRef.current = true;
          fetchLogs(true).finally(() => {
            isRefreshingRef.current = false;
          });
        }
      }, refreshInterval * 1000);
    }
  }, [isRealtime, refreshInterval, autoRefresh, fetchLogs]);

  // 실시간 업데이트 중지
  const stopRealtimeUpdates = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // 수동 새로고침 함수
  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;

    try {
      await fetchLogs(true);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [fetchLogs]);

  // 현재 페이지 설정
  const setCurrentPage = useCallback(
    (page: number) => {
      if (page < 1) page = 1;
      setStorePage(page);
    },
    [setStorePage]
  );

  // 통합된 상태와 액션 반환
  return {
    logs,
    services,
    severities,
    error,
    isLoading,
    isValidating,
    currentPage,
    totalCount,
    setCurrentPage,
    filters,
    updateFilters,
    isRealtime,
    refresh,
    selectedLogId,
    setSelectedLogId,
  };
}

export default useLogData;
