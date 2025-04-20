// lib/store/telemetryStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  RefreshIntervalOption,
  RealtimeRangeOption,
} from "@/lib/hooks/useTraceData";

// 기존의 필터 스토어 인터페이스에 실시간 관련 필드 추가
interface FilterStore {
  // 기존 필드 유지
  logFilters: LogFilters;
  setLogFilters: (filters: Partial<LogFilters>) => void;
  resetLogFilters: () => void;

  traceFilters: TraceFilters;
  setTraceFilters: (filters: Partial<TraceFilters>) => void;
  resetTraceFilters: () => void;

  timeRange: {
    startTime: number;
    endTime: number;
  };
  setTimeRange: (startTime: number, endTime: number) => void;

  selectedTraceId: string | null;
  setSelectedTraceId: (id: string | null) => void;

  selectedLogId: string | null;
  setSelectedLogId: (id: string | null) => void;

  selectedService: string | null;
  setSelectedService: (name: string | null) => void;

  // 실시간 모드 상태 (기존 필드)
  isRealtime: boolean;
  setIsRealtime: (isRealtime: boolean) => void;

  // 추가 필드: 실시간 모드 토글 함수
  toggleRealtime: (enabled?: boolean) => void;

  // 추가 필드: 실시간 관련 설정
  refreshInterval: RefreshIntervalOption;
  setRefreshInterval: (interval: RefreshIntervalOption) => void;

  realtimeRange: RealtimeRangeOption;
  setRealtimeRange: (range: RealtimeRangeOption) => void;
}

// 기본 필터 값 생성 함수 (기존 코드 유지)
const genDefaultFilter = () => ({
  service: null,
  severity: null,
  search: "",
  status: null,
  hasTrace: false,
  startTime: 0,
  endTime: 0,
  attributeKey: null,
});

// 기본 필터 값 (기존 코드 유지)
const DEFAULT_LOG_FILTERS: LogFilters = genDefaultFilter();
const DEFAULT_TRACE_FILTERS = genDefaultFilter() as TraceFilters;

// 필터 스토어 생성 - 실시간 모드 관련 기능 추가
export const useFilterStore = create<FilterStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 기존 상태와 함수들 유지
        logFilters: DEFAULT_LOG_FILTERS,
        setLogFilters: (filters) =>
          set((state) => ({
            logFilters: { ...state.logFilters, ...filters },
          })),
        resetLogFilters: () => set({ logFilters: DEFAULT_LOG_FILTERS }),

        traceFilters: DEFAULT_TRACE_FILTERS,
        setTraceFilters: (filters) =>
          set((state) => ({
            traceFilters: { ...state.traceFilters, ...filters },
          })),
        resetTraceFilters: () => set({ traceFilters: DEFAULT_TRACE_FILTERS }),

        timeRange: {
          startTime: 0,
          endTime: 0,
        },
        setTimeRange: (startTime, endTime) =>
          set({ timeRange: { startTime, endTime } }),

        selectedTraceId: null,
        setSelectedTraceId: (id) => set({ selectedTraceId: id }),

        selectedLogId: null,
        setSelectedLogId: (id) => set({ selectedLogId: id }),

        selectedService: null,
        setSelectedService: (name) => set({ selectedService: name }),

        // 기존 실시간 모드 상태
        isRealtime: false,
        setIsRealtime: (isRealtime) => set({ isRealtime }),

        // 추가: 실시간 모드 기본 설정
        refreshInterval: 5 as RefreshIntervalOption,
        setRefreshInterval: (interval) => set({ refreshInterval: interval }),

        realtimeRange: 5 as RealtimeRangeOption,
        setRealtimeRange: (range) => set({ realtimeRange: range }),

        // 추가: 실시간 모드 토글 함수
        toggleRealtime: (enabled) => {
          const currentIsRealtime = get().isRealtime;
          // enabled가 제공되면 해당 값으로, 아니면 현재 상태의 반대로 설정
          const newIsRealtime =
            enabled !== undefined ? enabled : !currentIsRealtime;

          // 현재 상태와 같으면 변경하지 않음
          if (newIsRealtime === currentIsRealtime) return;

          console.log(
            `[FilterStore] 실시간 모드 ${newIsRealtime ? "활성화" : "비활성화"}`
          );

          // 실시간 모드 활성화 시 현재 시간 기준으로 시간 범위 업데이트
          if (newIsRealtime) {
            const now = Date.now();
            const rangeInMs = get().realtimeRange * 60 * 1000; // 분 -> 밀리초

            set({
              isRealtime: true,
              timeRange: {
                startTime: now - rangeInMs,
                endTime: now,
              },
            });
          } else {
            // 실시간 모드 비활성화만 수행
            set({ isRealtime: false });
          }
        },
      }),
      {
        name: "telemetry-filter-storage",
        partialize: (state) => ({
          // 기존 저장 필드 유지
          logFilters: state.logFilters,
          traceFilters: state.traceFilters,
          timeRange: state.timeRange,
          // 실시간 모드는 기본적으로 off로 저장
          isRealtime: false,
          // 추가: 설정 값은 저장
          refreshInterval: state.refreshInterval,
          realtimeRange: state.realtimeRange,
        }),
      }
    )
  )
);

// 기존 텔레메트리 데이터 스토어 유지 - 변경 없음
export const useTelemetryStore = create<TelemetryStore>()(
  devtools((set) => ({
    traces: [],
    setTraces: (traces) => set({ traces }),
    addTraces: (traces) =>
      set((state) => ({
        traces: [...state.traces, ...traces],
      })),
    clearTraces: () => set({ traces: [] }),

    isLoadingTraces: false,
    setIsLoadingTraces: (isLoadingTraces) => set({ isLoadingTraces }),
  }))
);

interface TelemetryStore {
  // 트레이스 데이터
  traces: TraceItem[];
  setTraces: (traces: TraceItem[]) => void;
  addTraces: (traces: TraceItem[]) => void;
  clearTraces: () => void;

  isLoadingTraces: boolean;
  setIsLoadingTraces: (isLoading: boolean) => void;
}
