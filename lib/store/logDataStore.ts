import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { LoadingSlice, createLoadingSlice } from "./slices/loadingSlice";
import {
  PaginationSlice,
  createPaginationSlice,
} from "./slices/paginationSlice";
import { createLogFilterSlice, LogFilterSlice } from "./slices/logFilterSlice";
import { createLogDataSlice, LogDataSlice } from "./slices/logDataSlice";
import { buildLogApiUrl } from "@/lib/utils/filterUtils";
import { useFilterStore } from "./telemetryStore";

// 로그 데이터 상태 타입
export interface LogDataState
  extends LoadingSlice,
    PaginationSlice,
    LogFilterSlice,
    LogDataSlice {
  // 데이터 로딩 상태
  isValidating: boolean;

  // 액션
  fetchLogs: (forceRefresh?: boolean) => Promise<void>;
}

// API 데이터 페처
const fetchLogData = async (url: string): Promise<LogsResponse> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// 로그 스토어 생성
export const useLogDataStore = create<LogDataState>()(
  devtools(
    persist(
      (set, get, api) => ({
        // 슬라이스 연결
        ...createLoadingSlice(set, get, api),
        ...createPaginationSlice(set, get, api),
        ...createLogFilterSlice(set, get, api),
        ...createLogDataSlice(set, get, api),

        isValidating: false,

        fetchLogs: async (forceRefresh = false) => {
          const currentState = get();

          // 이미 로딩 중이고 강제 갱신이 아니면 중복 요청 방지
          if (currentState.status === "loading" && !forceRefresh) {
            return;
          }

          // 현재 필터 상태 가져오기
          const { timeRange } = useFilterStore.getState();
          const {
            searchQuery,
            selectedService,
            selectedSeverity,
            hasTrace,
            limit,
          } = currentState;

          // 페이지네이션 오프셋 계산
          const offset = (currentState.currentPage - 1) * currentState.pageSize;

          // 로딩 상태 설정
          set({ status: "loading", isValidating: true });

          try {
            // API URL 구성
            const apiUrl = buildLogApiUrl(
              `${process.env.NEXT_PUBLIC_API_BASE_PATH}/telemetry/logs`,
              {
                startTime: timeRange.startTime,
                endTime: timeRange.endTime,
                serviceName: selectedService,
                severity: selectedSeverity,
                hasTrace,
                query: searchQuery || undefined,
                limit,
              },
              offset
            );

            // 데이터 가져오기
            const response = await fetchLogData(apiUrl);

            // 상태 업데이트
            set({
              logs: response.data.logs || [],
              totalCount: response.data.pagination.total || 0,
              services: response.data.services || [],
              severities: response.data.severities || [],
              status: "success",
              error: null,
              isValidating: false,
            });

            // hasMore 업데이트
            currentState.updateHasMore(
              response.data.pagination.total || 0,
              currentState.currentPage
            );
          } catch (error) {
            set({
              status: "error",
              error: error instanceof Error ? error : new Error(String(error)),
              isValidating: false,
            });
          }
        },
      }),
      {
        name: "log-data-store",
        partialize: (state) => ({
          searchQuery: state.searchQuery,
          selectedService: state.selectedService,
          selectedSeverity: state.selectedSeverity,
          hasTrace: state.hasTrace,
          limit: state.limit,
          currentPage: state.currentPage,
        }),
      }
    )
  )
);

// 선택기 함수
export const useLogs = () => useLogDataStore((state) => state.logs);
export const useLogStatus = () => useLogDataStore((state) => state.status);
export const useLogError = () => useLogDataStore((state) => state.error);
export const useSelectedLogId = () =>
  useLogDataStore((state) => state.selectedLogId);

export default useLogDataStore;
