"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { TraceItem } from "@/lib/store/telemetryStore";

/**
 * 트레이스 시각화 데이터를 관리하는 커스텀 훅
 * - 데이터 로드, 필터링, 변환 로직을 컴포넌트에서 분리
 * - 재사용 가능한 쿼리 로직 구현
 * - 필터 상태 및 데이터 캐싱 지원
 */
export function useTraceVisualization(options: {
  initialStartTime?: number;
  initialEndTime?: number;
  serviceName?: string | null;
  status?: string | null;
  minDuration?: number;
  maxDuration?: number;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}) {
  // 옵션 설정
  const {
    initialStartTime = Date.now() - 3600000, // 기본값: 1시간 전
    initialEndTime = Date.now(),
    serviceName = null,
    status = null,
    minDuration,
    maxDuration,
    limit = 100,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  // 상태 관리
  const [timeRange, setTimeRange] = useState({
    startTime: initialStartTime,
    endTime: initialEndTime,
  });
  const [filters, setFilters] = useState({
    serviceName,
    status,
    minDuration,
    maxDuration,
  });
  const [traceData, setTraceData] = useState<TraceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedRef = useRef<number>(0);
  const cachedDataRef = useRef<{
    [key: string]: { timestamp: number; data: TraceItem[] };
  }>({});

  // 캐시 키 생성
  const getCacheKey = useCallback(() => {
    const { startTime, endTime } = timeRange;
    const { serviceName, status, minDuration, maxDuration } = filters;
    return JSON.stringify({
      startTime,
      endTime,
      serviceName,
      status,
      minDuration,
      maxDuration,
      limit,
    });
  }, [timeRange, filters, limit]);

  // API 요청 파라미터 생성
  const getQueryParams = useCallback(() => {
    const { startTime, endTime } = timeRange;
    const { serviceName, status, minDuration, maxDuration } = filters;

    const params: Record<string, string> = {
      startTime: startTime.toString(),
      endTime: endTime.toString(),
      limit: limit.toString(),
    };

    if (serviceName) params.serviceName = serviceName;
    if (status) params.status = status;
    if (minDuration !== undefined) params.minDuration = minDuration.toString();
    if (maxDuration !== undefined) params.maxDuration = maxDuration.toString();

    return params;
  }, [timeRange, filters, limit]);

  // 쿼리 URL 생성
  const getQueryUrl = useCallback(() => {
    const params = getQueryParams();
    const queryString = new URLSearchParams(params).toString();
    return `/api/telemetry/traces?${queryString}`;
  }, [getQueryParams]);

  // 데이터 로드 함수
  const fetchData = useCallback(
    async (forceRefresh = false) => {
      try {
        const cacheKey = getCacheKey();
        const now = Date.now();

        // 캐시 활용 (5초 내 동일 쿼리는 캐시 사용)
        if (
          !forceRefresh &&
          cachedDataRef.current[cacheKey] &&
          now - cachedDataRef.current[cacheKey].timestamp < 5000
        ) {
          setTraceData(cachedDataRef.current[cacheKey].data);
          return cachedDataRef.current[cacheKey].data;
        }

        setIsLoading(true);
        setError(null);

        const url = getQueryUrl();
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
        const traces = data.traces || [];

        // 데이터 변환 및 필터링
        const processedData = processTraceData(traces);

        // 결과 저장
        setTraceData(processedData);
        lastFetchedRef.current = now;

        // 캐시에 저장
        cachedDataRef.current[cacheKey] = {
          timestamp: now,
          data: processedData,
        };

        return processedData;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("알 수 없는 오류 발생");
        setError(error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [getCacheKey, getQueryUrl],
  );

  // 데이터 처리 함수
  const processTraceData = useCallback((traces: TraceItem[]): TraceItem[] => {
    // 여기에 필요한 데이터 변환 로직 추가
    // 예: 정렬, 필터링, 계산 등

    // 시간순 정렬
    return [...traces].sort((a, b) => b.startTime - a.startTime);
  }, []);

  // 필터 업데이트 함수
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  // 시간 범위 업데이트 함수
  const updateTimeRange = useCallback(
    (newTimeRange: Partial<typeof timeRange>) => {
      setTimeRange((prev) => ({
        ...prev,
        ...newTimeRange,
      }));
    },
    [],
  );

  // 시간 범위 프리셋 함수
  const setTimeRangePreset = useCallback(
    (preset: "hour" | "day" | "week" | "month") => {
      const now = Date.now();
      let startTime;

      switch (preset) {
        case "hour":
          startTime = now - 3600000; // 1시간
          break;
        case "day":
          startTime = now - 86400000; // 24시간
          break;
        case "week":
          startTime = now - 604800000; // 7일
          break;
        case "month":
          startTime = now - 2592000000; // 30일
          break;
        default:
          startTime = now - 3600000;
      }

      setTimeRange({
        startTime,
        endTime: now,
      });
    },
    [],
  );

  // 자동 업데이트 설정
  useEffect(() => {
    if (autoRefresh) {
      // 초기 데이터 로드
      fetchData();

      // 주기적 갱신 설정
      refreshTimerRef.current = setInterval(() => {
        fetchData(true);
      }, refreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchData]);

  // 필터 또는 시간 범위 변경 시 데이터 리로드
  useEffect(() => {
    fetchData();
  }, [filters, timeRange, fetchData]);

  // 필요한 값과 함수 반환
  return {
    // 상태
    traceData,
    isLoading,
    error,
    timeRange,
    filters,

    // 데이터 로드 함수
    fetchData,
    refetch: () => fetchData(true),

    // 필터 관련 함수
    updateFilters,
    updateTimeRange,
    setTimeRangePreset,

    // 유틸리티 함수
    getQueryParams,
    getQueryUrl,
  };
}

export default useTraceVisualization;
