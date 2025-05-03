// lib/store/traceDataStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { LoadingSlice, createLoadingSlice } from "./slices/loadingSlice";
import {
  PaginationSlice,
  createPaginationSlice,
} from "./slices/paginationSlice";
import { createDataSlice, DataSlice } from "./slices/dataSlice";
import { buildTraceApiUrl } from "@/lib/utils/filterUtils";
import { useFilterStore } from "./telemetryStore";
import { useTraceFilterStore } from "./traceFilterStore";
import { TraceItem, TracesResponse } from "./types";

// 트레이스 데이터 상태 타입
export interface TraceDataState
  extends LoadingSlice,
    PaginationSlice,
    DataSlice<TraceItem> {
  // 선택 상태
  selectedTraceId: string | null;
  setSelectedTraceId: (id: string | null) => void;

  // 데이터 가져오기 상태
  isValidating: boolean;

  // 액션
  fetchTraces: (forceRefresh?: boolean) => Promise<void>;
}

// API 데이터 페처
const fetchTraceData = async (url: string): Promise<TracesResponse> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("[traceDataStore] Error fetching trace data:", error);
    throw error;
  }
};

// 트레이스 스토어 생성
export const useTraceDataStore = create<TraceDataState>()(
  devtools(
    (set, get, api) => ({
      // 슬라이스 연결
      ...createLoadingSlice(set, get, api),
      ...createPaginationSlice(set, get, api),
      ...createDataSlice<TraceItem>([])(set, get, api),

      // 선택 상태 초기화
      selectedTraceId: null,
      setSelectedTraceId: (id) => set({ selectedTraceId: id }),

      // 데이터 가져오기 상태
      isValidating: false,

      // 데이터 가져오기 액션
      fetchTraces: async (forceRefresh = false) => {
        const currentState = get();

        // 이미 로딩 중이고 강제 갱신이 아니면 중복 요청 방지
        if (currentState.status === "loading" && !forceRefresh) {
          console.log(
            "[traceDataStore] Already fetching data, skipping duplicate request"
          );
          return;
        }

        // 현재 필터 상태 가져오기
        const { timeRange, isRealtime } = useFilterStore.getState();
        const {
          searchQuery,
          selectedServices,
          selectedStatuses,
          minDuration,
          maxDuration,
          attributeKey,
          rootSpansOnly,
          limit,
          sortField,
          sortDirection,
        } = useTraceFilterStore.getState();

        // 페이지네이션 오프셋 계산
        const offset = (currentState.currentPage - 1) * currentState.pageSize;

        // 로딩 상태 설정
        set({ status: "loading", isValidating: true });

        try {
          // API URL 구성
          const apiUrl = buildTraceApiUrl(
            `${process.env.NEXT_PUBLIC_API_BASE_PATH}/telemetry/traces`,
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

          console.log(
            "[traceDataStore] Fetching trace data:",
            apiUrl.slice(0, 100) + "..."
          );

          // 데이터 가져오기
          const response = await fetchTraceData(apiUrl);

          // 상태 업데이트
          set({
            data: response.traces || [],
            totalCount: response.total || 0,
            status: "success",
            error: null,
            lastFetched: Date.now(),
            isValidating: false,
          });

          // hasMore 업데이트
          currentState.updateHasMore(
            response.total || 0,
            currentState.currentPage
          );

          console.log(
            `[traceDataStore] Fetched ${response.traces?.length || 0} traces out of ${response.total || 0}`
          );
        } catch (error) {
          console.error("[traceDataStore] Error fetching traces:", error);
          set({
            status: "error",
            error: error instanceof Error ? error : new Error(String(error)),
            isValidating: false,
          });
        }
      },
    }),
    { name: "trace-data-store" }
  )
);

// 선택기 함수
export const useTraces = () => useTraceDataStore((state) => state.data);
export const useTraceStatus = () => useTraceDataStore((state) => state.status);
export const useTraceError = () => useTraceDataStore((state) => state.error);
export const useSelectedTraceId = () =>
  useTraceDataStore((state) => state.selectedTraceId);

export default useTraceDataStore;
