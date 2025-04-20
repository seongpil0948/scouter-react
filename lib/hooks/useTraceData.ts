// lib/hooks/useTraceData.ts
import useSWR from "swr";
import { useCallback, useEffect, useState, useRef } from "react";
import { useFilterStore } from "@/lib/store/telemetryStore";
import { useTraceFilterStore } from "@/lib/store/traceFilterStore";
import { buildTraceApiUrl } from "@/lib/utils/filterUtils";

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

// API 응답 fetcher 함수
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * 트레이스 데이터를 가져오고 관리하는 커스텀 훅
 * - 필터 상태와 시간 범위에 따라 API URL 자동 생성
 * - 실시간 데이터 조회 기능 제공
 * - 데이터 수동 리프레시 기능 제공
 * - 실시간 갱신 간격 및 범위 설정 가능
 */
export function useTraceData({
  rootSpansOnly = true,
  initialOffset = 0,
}: UseTraceDataOptions = {}) {
  const {
    timeRange,
    setTimeRange,
    isRealtime,
    toggleRealtime: storeToggleRealtime,
    refreshInterval,
    setRefreshInterval: storeSetRefreshInterval,
    realtimeRange,
    setRealtimeRange: storeSetRealtimeRange,
  } = useFilterStore();
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
    refreshData: triggerRefresh = () => {},
  } = useTraceFilterStore();

  const [offset, setOffset] = useState(initialOffset);
  const [currentRefreshInterval, setCurrentRefreshInterval] =
    useState<RefreshIntervalOption>(refreshInterval);
  const [currentRealtimeRange, setCurrentRealtimeRange] =
    useState<RealtimeRangeOption>(realtimeRange);
  const [customRefreshInterval, setCustomRefreshInterval] = useState<
    number | undefined
  >(undefined);

  // 초기화 완료 여부를 추적
  const isInitialized = useRef(false);
  // 이전 API URL 추적
  const prevApiUrlRef = useRef<string | null>(null);
  // 이전 시간 범위 추적
  const prevTimeRangeRef = useRef({ startTime: 0, endTime: 0 });
  // API 요청 중 여부 플래그
  const isRequestingRef = useRef(false);

  // 시간 범위가 설정되지 않았는지 확인 (기본값 또는 0인 경우)
  const isTimeRangeEmpty =
    !timeRange.startTime ||
    !timeRange.endTime ||
    (timeRange.startTime === 0 && timeRange.endTime === 0);

  // 현재 시간 기준으로 시간 범위 업데이트
  const updateRealtimeRange = useCallback(() => {
    if (!isRealtime) return timeRange; // 실시간 모드가 아니면 현재 상태 그대로 반환

    const now = Date.now();
    const rangeInMs = currentRealtimeRange * 60 * 1000; // 분 -> 밀리초 변환
    const startTime = now - rangeInMs;

    // 정밀한 업데이트 조건 - 최소 3초 차이가 날 때만 업데이트
    const timeDiff = now - timeRange.endTime;
    const significantChange = timeDiff > 3000; // 3초 이상 차이날 때

    if (significantChange) {
      console.log(
        `[useTraceData] 실시간 시간 범위 업데이트: ${new Date(startTime).toLocaleString()} ~ ${new Date(now).toLocaleString()}`
      );
      setTimeRange(startTime, now);
      prevTimeRangeRef.current = { startTime, endTime: now };
      return { startTime, endTime: now };
    }

    return timeRange;
  }, [setTimeRange, currentRealtimeRange, timeRange, isRealtime]);

  // 초기화 - 첫 마운트 시 실행
  useEffect(() => {
    // 이미 초기화되었으면 건너뛰기
    if (isInitialized.current) return;

    // 초기 시간 범위 설정
    const now = Date.now();
    const rangeInMs = currentRealtimeRange * 60 * 1000;
    const startTime = now - rangeInMs;

    // 시간 범위가 비어있거나 0인 경우에만 초기화
    if (isTimeRangeEmpty) {
      console.log("초기화: 시간 범위 설정", {
        startTime: new Date(startTime).toLocaleString(),
        endTime: new Date(now).toLocaleString(),
      });

      // 시간 범위 설정
      setTimeRange(startTime, now);
      prevTimeRangeRef.current = { startTime, endTime: now };
    } else {
      console.log("초기화: 기존 시간 범위 유지", {
        startTime: new Date(timeRange.startTime).toLocaleString(),
        endTime: new Date(timeRange.endTime).toLocaleString(),
      });

      prevTimeRangeRef.current = { ...timeRange };
    }

    // 실시간 모드 설정
    if (isRealtime) {
      setCustomRefreshInterval(currentRefreshInterval * 1000);
    }

    // 초기화 완료 표시
    isInitialized.current = true;
  }, [
    isTimeRangeEmpty,
    setTimeRange,
    currentRealtimeRange,
    isRealtime,
    currentRefreshInterval,
    timeRange,
  ]);

  // API URL 생성 전 현재 시간 범위 확인
  const getApiUrl = useCallback(() => {
    if (!isInitialized.current || isTimeRangeEmpty) {
      const now = Date.now();
      const rangeInMs = currentRealtimeRange * 60 * 1000;
      const startTime = now - rangeInMs;

      // 실제 API URL 빌드 시 현재 시간 사용
      return buildTraceApiUrl(
        "/api/telemetry/traces",
        {
          searchQuery,
          selectedServices,
          selectedStatuses,
          minDuration,
          maxDuration,
          attributeKey,
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
      "/api/telemetry/traces",
      {
        searchQuery,
        selectedServices,
        selectedStatuses,
        minDuration,
        maxDuration,
        attributeKey,
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
    attributeKey,
    timeRange,
    limit,
    sortField,
    sortDirection,
    offset,
    rootSpansOnly,
    currentRealtimeRange,
  ]);

  // API URL 변경 감지 및 로깅
  const apiUrl = getApiUrl();
  useEffect(() => {
    if (prevApiUrlRef.current !== apiUrl) {
      console.log(
        "[useTraceData] API URL 변경:",
        apiUrl.substring(0, 100) + (apiUrl.length > 100 ? "..." : "")
      );
      prevApiUrlRef.current = apiUrl;
    }
  }, [apiUrl]);

  // SWR용 fetcher 함수 - 커스텀 키 처리
  const customFetcher = useCallback(
    async ([url, refresh]: [string, number]) => {
      // 요청 중 플래그 설정
      if (isRequestingRef.current) {
        console.log("[useTraceData] 이미 요청 중, 중복 요청 방지");
        return null;
      }

      isRequestingRef.current = true;

      try {
        // 실시간 모드인 경우 현재 시간 기준으로 URL 재구성
        if (isRealtime) {
          const now = Date.now();
          const rangeInMs = currentRealtimeRange * 60 * 1000;
          const startTime = now - rangeInMs;

          // 새로운 URL 생성 - 기존 URL 수정이 아닌 새로 만들기
          const newUrl = buildTraceApiUrl(
            "/api/telemetry/traces",
            {
              searchQuery,
              selectedServices,
              selectedStatuses,
              minDuration,
              maxDuration,
              attributeKey,
            },
            { startTime, endTime: now },
            limit,
            sortField,
            sortDirection,
            offset,
            { rootSpansOnly }
          );

          console.log(
            `[useTraceData] 실시간 모드 데이터 요청: ${new Date(startTime).toLocaleString()} ~ ${new Date(now).toLocaleString()}`
          );
          const result = await fetcher(newUrl);
          return result;
        }

        // 일반 모드
        return await fetcher(url);
      } catch (error) {
        console.error("[useTraceData] 데이터 로드 오류:", error);
        throw error;
      } finally {
        // 요청 완료 플래그 설정 (비동기로 처리)
        setTimeout(() => {
          isRequestingRef.current = false;
        }, 500);
      }
    },
    [
      isRealtime,
      currentRealtimeRange,
      searchQuery,
      selectedServices,
      selectedStatuses,
      minDuration,
      maxDuration,
      attributeKey,
      limit,
      sortField,
      sortDirection,
      offset,
      rootSpansOnly,
    ]
  );

  // 데이터 가져오기
  const { data, error, mutate, isLoading, isValidating } =
    useSWR<TracesResponse>([apiUrl, lastRefreshed], customFetcher, {
      refreshInterval: customRefreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 3000, // 중복 요청 방지 간격 3초
      focusThrottleInterval: 5000, // 포커스 시 과도한 재요청 방지
      keepPreviousData: true, // 새 데이터 로드 중에도 이전 데이터 유지
      errorRetryCount: 3, // 오류 시 재시도 횟수 제한
      onSuccess: (data) => {
        if (data?.traces) {
          console.log(
            `[useTraceData] 데이터 로드 성공: ${data.traces.length}개 트레이스`
          );
        }
      },
      onError: (err) => {
        console.error("[useTraceData] 데이터 로드 오류:", err);
      },
      isPaused: () => {
        // URL이 비어있거나 요청 처리 중이면 일시 중지
        return !apiUrl || apiUrl.length < 10 || isRequestingRef.current;
      },
    });

  // 현재 페이지 설정
  const setCurrentPage = useCallback(
    (page: number) => {
      setOffset((page - 1) * limit);
    },
    [limit]
  );

  // 현재 페이지 계산
  const currentPage = Math.floor(offset / limit) + 1;

  // 데이터 새로고침 (중복 요청 방지)
  const refresh = useCallback(() => {
    // 이미 요청 중이면 무시
    if (isRequestingRef.current) {
      console.log("[useTraceData] 이미 요청 중, 새로고침 무시");
      return;
    }

    // Store의 refreshData 함수 호출 (있는 경우)
    if (typeof triggerRefresh === "function") {
      triggerRefresh();
    }

    // 실시간 모드인 경우 시간 범위도 업데이트
    if (isRealtime) {
      updateRealtimeRange();
    }

    // 데이터 리로드 (잠금 설정)
    isRequestingRef.current = true;

    console.log("[useTraceData] 데이터 새로고침 요청");
    const promise = mutate();

    // 요청 완료 후 잠금 해제 (성공이든 실패든)
    promise.finally(() => {
      setTimeout(() => {
        isRequestingRef.current = false;
      }, 500);
    });

    return promise;
  }, [isRealtime, mutate, updateRealtimeRange, triggerRefresh]);

  // 실시간 모드 전환 시 실행되는 부수 효과
  useEffect(() => {
    // 실시간 모드 활성화 상태 변경 시에만 실행
    if (isRealtime) {
      console.log("[useTraceData] 실시간 모드 활성화 감지");

      // 갱신 간격 설정
      setCustomRefreshInterval(currentRefreshInterval * 1000);

      // 즉시 시간 범위 업데이트
      updateRealtimeRange();

      // 데이터 즉시 로드
      const timeoutId = setTimeout(() => {
        if (!isRequestingRef.current) {
          refresh();
        }
      }, 200);

      return () => clearTimeout(timeoutId);
    } else {
      // 실시간 모드 비활성화
      setCustomRefreshInterval(undefined);
    }
  }, [isRealtime, currentRefreshInterval, updateRealtimeRange, refresh]);

  // 실시간 모드 설정/해제
  const toggleRealtime = useCallback(
    (enabled: boolean) => {
      // 스토어의 toggleRealtime 함수 호출
      storeToggleRealtime(enabled);

      // 리프레시 간격 설정
      if (enabled) {
        setCustomRefreshInterval(refreshInterval * 1000);
        // 즉시 데이터 갱신
        setTimeout(() => refresh(), 100);
      } else {
        setCustomRefreshInterval(undefined);
      }
    },
    [refreshInterval, refresh, storeToggleRealtime]
  );

  // 스토어의 setRefreshInterval 함수 사용
  const setRefreshInterval = useCallback(
    (interval: RefreshIntervalOption) => {
      storeSetRefreshInterval(interval);

      if (isRealtime) {
        setCustomRefreshInterval(interval * 1000);
      }
    },
    [isRealtime, storeSetRefreshInterval]
  );

  // 스토어의 setRealtimeRange 함수 사용
  const setRealtimeRange = useCallback(
    (range: RealtimeRangeOption) => {
      storeSetRealtimeRange(range);

      if (isRealtime) {
        const now = Date.now();
        const rangeInMs = range * 60 * 1000;

        setTimeRange(now - rangeInMs, now);
        setTimeout(() => refresh(), 100);
      }
    },
    [isRealtime, refresh, setTimeRange, storeSetRealtimeRange]
  );

  return {
    data,
    traces: data?.traces || [],
    error,
    isLoading,
    isValidating,
    refresh,
    refreshData: refresh,

    isRealtime,
    toggleRealtime,
    currentPage,
    setCurrentPage,
    totalCount: data?.total || 0,
    timeRange,
    refreshInterval,
    setRefreshInterval,
    realtimeRange,
    setRealtimeRange,
  };
}

export default useTraceData;
