// lib/hooks/useTraceData.ts
import useSWR from 'swr';
import { useCallback, useEffect, useState } from 'react';
import { useFilterStore } from '@/lib/store/telemetryStore';
import { useTraceFilterStore } from '@/lib/store/traceFilterStore';
import { buildTraceApiUrl } from '@/lib/utils/filterUtils';

// API 응답 fetcher 함수
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseTraceDataOptions {
  refreshInterval?: number; // 실시간 데이터 조회 간격 (ms)
  rootSpansOnly?: boolean; // 루트 스팬만 조회할지 여부
  initialOffset?: number; // 페이지네이션 오프셋
}

/**
 * 트레이스 데이터를 가져오고 관리하는 커스텀 훅
 * - 필터 상태와 시간 범위에 따라 API URL 자동 생성
 * - 실시간 데이터 조회 기능 제공 (시간 범위 미설정 시)
 * - 데이터 수동 리프레시 기능 제공
 */
export function useTraceData({
  refreshInterval = 5000, // 기본값: 5초
  rootSpansOnly = true,
  initialOffset = 0
}: UseTraceDataOptions = {}) {
  const { timeRange, setTimeRange } = useFilterStore();
  const {
    searchQuery,
    limit,
    selectedServices,
    selectedStatuses,
    minDuration,
    maxDuration,
    sortField,
    sortDirection,
    lastRefreshed
  } = useTraceFilterStore();

  const [offset, setOffset] = useState(initialOffset);
  const [isRealtime, setIsRealtime] = useState(false);
  const [customRefreshInterval, setCustomRefreshInterval] = useState<number | undefined>(undefined);

  // 시간 범위가 설정되지 않았는지 확인 (기본값 또는 0인 경우)
  const isTimeRangeEmpty = !timeRange.startTime || !timeRange.endTime || 
                          (timeRange.startTime === 0 && timeRange.endTime === 0);

  // 실시간 모드에서 사용할 시간 범위 설정 (5분 전 ~ 현재)
  const updateRealtimeRange = useCallback(() => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000; // 5분 전
    
    setTimeRange(fiveMinutesAgo, now);
    return { startTime: fiveMinutesAgo, endTime: now };
  }, [setTimeRange]);

  // 실시간 모드 설정/해제
  useEffect(() => {
    // 시간 범위가 비어있으면 실시간 모드 활성화
    if (isTimeRangeEmpty) {
      setIsRealtime(true);
      updateRealtimeRange();
      setCustomRefreshInterval(refreshInterval);
    } else {
      // 사용자가 시간 범위를 지정한 경우 실시간 모드 비활성화
      setIsRealtime(false);
      setCustomRefreshInterval(undefined);
    }
  }, [isTimeRangeEmpty, refreshInterval, updateRealtimeRange]);

  // 페이지 로드 시 최초 실행 - 초기 시간 범위 설정
  useEffect(() => {
    if (isTimeRangeEmpty) {
      updateRealtimeRange();
    }
  }, [isTimeRangeEmpty, updateRealtimeRange]);

  // API URL 생성
  const apiUrl = buildTraceApiUrl(
    '/api/telemetry/traces',
    {
      searchQuery,
      selectedServices,
      selectedStatuses,
      minDuration,
      maxDuration,
    },
    timeRange,
    limit,
    sortField,
    sortDirection,
    offset,
    { rootSpansOnly }
  );

  // 데이터 가져오기
  const { data, error, mutate, isLoading, isValidating } = useSWR<TracesResponse>(
    [apiUrl, lastRefreshed],
    () => fetcher(apiUrl),
    {
      refreshInterval: customRefreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 1000,
    }
  );

  // 현재 페이지 설정
  const setCurrentPage = useCallback((page: number) => {
    setOffset((page - 1) * limit);
  }, [limit]);

  // 현재 페이지 계산
  const currentPage = Math.floor(offset / limit) + 1;

  // 데이터 새로고침
  const refresh = useCallback(() => {
    // 실시간 모드인 경우 시간 범위도 업데이트
    if (isRealtime) {
      updateRealtimeRange();
    }
    return mutate();
  }, [isRealtime, mutate, updateRealtimeRange]);

  // 실시간 모드 설정/해제
  const toggleRealtime = useCallback((enabled: boolean) => {
    setIsRealtime(enabled);
    if (enabled) {
      updateRealtimeRange();
      setCustomRefreshInterval(refreshInterval);
    } else {
      setCustomRefreshInterval(undefined);
    }
  }, [refreshInterval, updateRealtimeRange]);

  return {
    data,
    traces: data?.traces || [],
    error,
    isLoading,
    isValidating,
    refresh,
    isRealtime,
    toggleRealtime,
    currentPage,
    setCurrentPage,
    totalCount: data?.total || 0,
    timeRange,
  };
}

export default useTraceData;