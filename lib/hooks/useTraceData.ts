// lib/hooks/useTraceData.ts
import useSWR from 'swr';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useFilterStore } from '@/lib/store/telemetryStore';
import { useTraceFilterStore } from '@/lib/store/traceFilterStore';
import { buildTraceApiUrl } from '@/lib/utils/filterUtils';

// API 응답 fetcher 함수
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// 실시간 갱신 간격 옵션 (초)
export type RefreshIntervalOption = 5 | 10 | 30 | 60;

// 실시간 시간 범위 옵션 (분)
export type RealtimeRangeOption = 1 | 5 | 10 | 15 | 30;

interface UseTraceDataOptions {
  refreshInterval?: RefreshIntervalOption; // 기본 실시간 데이터 조회 간격 (초)
  realtimeRange?: RealtimeRangeOption; // 기본 실시간 시간 범위 (분)
  rootSpansOnly?: boolean; // 루트 스팬만 조회할지 여부
  initialOffset?: number; // 페이지네이션 오프셋
}

/**
 * 트레이스 데이터를 가져오고 관리하는 커스텀 훅
 * - 필터 상태와 시간 범위에 따라 API URL 자동 생성
 * - 실시간 데이터 조회 기능 제공
 * - 데이터 수동 리프레시 기능 제공
 * - 실시간 갱신 간격 및 범위 설정 가능
 */
export function useTraceData({
  refreshInterval = 5, // 기본값: 5초
  realtimeRange = 5, // 기본값: 5분
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
    lastRefreshed,
    attributeKey,
    refreshData: triggerRefresh = () => {}
  } = useTraceFilterStore();

  const [offset, setOffset] = useState(initialOffset);
  const [isRealtime, setIsRealtime] = useState(false);
  const [currentRefreshInterval, setCurrentRefreshInterval] = useState<RefreshIntervalOption>(refreshInterval);
  const [currentRealtimeRange, setCurrentRealtimeRange] = useState<RealtimeRangeOption>(realtimeRange);
  const [customRefreshInterval, setCustomRefreshInterval] = useState<number | undefined>(undefined);
  
  // 초기화 완료 여부를 추적
  const isInitialized = useRef(false);

  // 시간 범위가 설정되지 않았는지 확인 (기본값 또는 0인 경우)
  const isTimeRangeEmpty = !timeRange.startTime || !timeRange.endTime || 
                          (timeRange.startTime === 0 && timeRange.endTime === 0);

  // 현재 시간 기준으로 시간 범위 업데이트
  const updateRealtimeRange = useCallback(() => {
    const now = Date.now();
    const rangeInMs = currentRealtimeRange * 60 * 1000; // 분 -> 밀리초 변환
    const startTime = now - rangeInMs;
    
    // 현재 상태와 다를 때만 업데이트하여 불필요한 렌더링 방지
    if (timeRange.startTime !== startTime || timeRange.endTime !== now) {
      console.log(`시간 범위 업데이트: ${new Date(startTime).toLocaleString()} ~ ${new Date(now).toLocaleString()}`);
      setTimeRange(startTime, now);
    }
    return { startTime, endTime: now };
  }, [setTimeRange, currentRealtimeRange, timeRange]);

  // 초기화 - 시간 범위 설정 및 실시간 모드 설정
  useEffect(() => {
    // 이미 초기화되었으면 건너뛰기
    if (isInitialized.current) return;
    
    // 초기 시간 범위 설정
    const now = Date.now();
    const rangeInMs = currentRealtimeRange * 60 * 1000;
    const startTime = now - rangeInMs;
    
    console.log('초기화: 시간 범위 설정', {
      startTime: new Date(startTime).toLocaleString(),
      endTime: new Date(now).toLocaleString() 
    });
    
    // 시간 범위 설정
    setTimeRange(startTime, now);
    
    // 실시간 모드 초기화
    setIsRealtime(true);
    setCustomRefreshInterval(currentRefreshInterval * 1000);
    
    // 초기화 완료 표시
    isInitialized.current = true;
  }, []);

  // API URL 생성 전 현재 시간 범위 확인
  const getApiUrl = useCallback(() => {
    if (!isInitialized.current || isTimeRangeEmpty) {
      const now = Date.now();
      const rangeInMs = currentRealtimeRange * 60 * 1000;
      const startTime = now - rangeInMs;
      
      // 실제 API URL 빌드 시 현재 시간 사용
      return buildTraceApiUrl(
        '/api/telemetry/traces',
        {
          searchQuery,
          selectedServices,
          selectedStatuses,
          minDuration,
          maxDuration,
          attributeKey, // 추가: attributeKey 전달
        },
        { startTime, endTime: now },
        limit,
        sortField,
        sortDirection,
        offset,
        { rootSpansOnly }
      );
    }
    
    // 정상적인 경우 현재 상태의 시간 범위 사용
    return buildTraceApiUrl(
      '/api/telemetry/traces',
      {
        searchQuery,
        selectedServices,
        selectedStatuses,
        minDuration,
        maxDuration,
        attributeKey, // 추가: attributeKey 전달
      },
      timeRange,
      limit,
      sortField,
      sortDirection,
      offset,
      { rootSpansOnly }
    );
  }, [
    isInitialized,
    isTimeRangeEmpty,
    searchQuery,
    selectedServices,
    selectedStatuses,
    minDuration,
    maxDuration,
    attributeKey, // 추가: 의존성 배열에 attributeKey 추가
    timeRange,
    limit,
    sortField,
    sortDirection,
    offset,
    rootSpansOnly,
    currentRealtimeRange
  ]);

  // SWR용 fetcher 함수 - 커스텀 키 처리
  const customFetcher = useCallback(async ([url, refresh]: [string, number]) => {
    // 실시간 모드인 경우 현재 시간 기준으로 URL 재구성
    if (isRealtime) {
      const now = Date.now();
      const rangeInMs = currentRealtimeRange * 60 * 1000;
      const startTime = now - rangeInMs;
      
      // 새로운 URL 생성 - 기존 URL 수정이 아닌 새로 만들기
      const newUrl = buildTraceApiUrl(
        '/api/telemetry/traces',
        {
          searchQuery,
          selectedServices,
          selectedStatuses,
          minDuration,
          maxDuration,
          attributeKey, // 추가: attributeKey 전달
        },
        { startTime, endTime: now },
        limit,
        sortField,
        sortDirection,
        offset,
        { rootSpansOnly }
      );
      
      console.log(`실시간 모드 데이터 요청: ${new Date(startTime).toLocaleString()} ~ ${new Date(now).toLocaleString()}`);
      return fetcher(newUrl);
    }
    
    // 일반 모드
    return fetcher(url);
  }, [
    isRealtime,
    currentRealtimeRange,
    searchQuery,
    selectedServices,
    selectedStatuses,
    minDuration,
    maxDuration,
    attributeKey, // 추가: 의존성 배열에 attributeKey 추가
    limit,
    sortField,
    sortDirection,
    offset,
    rootSpansOnly
  ]);

  // 현재 API URL 
  const apiUrl = getApiUrl();

  // 데이터 가져오기
  const { data, error, mutate, isLoading, isValidating } = useSWR<TracesResponse>(
    [apiUrl, lastRefreshed], 
    customFetcher,
    {
      refreshInterval: customRefreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 1000,
      onSuccess: (data) => {
        console.log(`데이터 로드 성공: ${data?.traces?.length || 0}개 트레이스`);
      },
      onError: (err) => {
        console.error('데이터 로드 오류:', err);
      }
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
    // Store의 refreshData 함수 호출 (있는 경우)
    if (typeof triggerRefresh === 'function') {
      triggerRefresh();
    }
    
    // 실시간 모드인 경우 시간 범위도 업데이트
    if (isRealtime) {
      updateRealtimeRange();
    }
    
    // 데이터 리로드
    return mutate();
  }, [isRealtime, mutate, updateRealtimeRange, triggerRefresh]);

  // 실시간 모드 설정/해제
  const toggleRealtime = useCallback((enabled: boolean) => {
    if (enabled === isRealtime) return; // 이미 같은 상태면 무시
    
    setIsRealtime(enabled);
    if (enabled) {
      updateRealtimeRange();
      setCustomRefreshInterval(currentRefreshInterval * 1000); // 초 -> 밀리초 변환
      // 즉시 데이터 갱신
      setTimeout(() => refresh(), 0);
    } else {
      setCustomRefreshInterval(undefined);
    }
  }, [currentRefreshInterval, updateRealtimeRange, isRealtime, refresh]);

  // 실시간 갱신 간격 변경
  const setRefreshIntervalOption = useCallback((interval: RefreshIntervalOption) => {
    if (interval === currentRefreshInterval) return; // 같은 값이면 변경 없음
    
    setCurrentRefreshInterval(interval);
    if (isRealtime) {
      setCustomRefreshInterval(interval * 1000); // 초 -> 밀리초 변환
    }
  }, [isRealtime, currentRefreshInterval]);

  // 실시간 시간 범위 변경
  const setRealtimeRangeOption = useCallback((range: RealtimeRangeOption) => {
    if (range === currentRealtimeRange) return; // 같은 값이면 변경 없음
    
    setCurrentRealtimeRange(range);
    if (isRealtime) {
      // 범위가 변경되면 즉시 새로고침
      const now = Date.now();
      const rangeInMs = range * 60 * 1000;
      const startTime = now - rangeInMs;
      
      if (timeRange.startTime !== startTime || timeRange.endTime !== now) {
        setTimeRange(startTime, now);
        // 상태 변경 후 명시적 리프레시
        setTimeout(() => refresh(), 0);
      }
    }
  }, [isRealtime, currentRealtimeRange, timeRange, setTimeRange, refresh]);

  return {
    data,
    traces: data?.traces || [],
    error,
    isLoading,
    isValidating,
    refresh,
    refreshData: refresh, // 별칭
    isRealtime,
    toggleRealtime,
    currentPage,
    setCurrentPage,
    totalCount: data?.total || 0,
    timeRange,
    refreshInterval: currentRefreshInterval,
    setRefreshInterval: setRefreshIntervalOption,
    realtimeRange: currentRealtimeRange,
    setRealtimeRange: setRealtimeRangeOption,
  };
}

export default useTraceData;