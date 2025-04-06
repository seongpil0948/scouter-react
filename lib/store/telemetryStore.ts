// app/lib/store/telemetryStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";


const genDefaultFilter = () => ({
  service: null,
  severity: null,
  search: "",
  hasTrace: false,
  startTime: Date.now() - (60 * 60 * 1000) * 24, // 1일 전
  endTime: Date.now(),
})
// 기본 필터 값
const DEFAULT_LOG_FILTERS: LogFilters = genDefaultFilter();

const DEFAULT_TRACE_FILTERS: TraceFilters = genDefaultFilter()

// 필터 스토어 생성
export const useFilterStore = create<FilterStore>()(
  devtools(
    persist(
      (set) => ({
        // 로그 필터
        logFilters: DEFAULT_LOG_FILTERS,
        setLogFilters: (filters) =>
          set((state) => ({
            logFilters: { ...state.logFilters, ...filters },
          })),
        resetLogFilters: () => set({ logFilters: DEFAULT_LOG_FILTERS }),

        // 트레이스 필터
        traceFilters: DEFAULT_TRACE_FILTERS,
        setTraceFilters: (filters) =>
          set((state) => ({
            traceFilters: { ...state.traceFilters, ...filters },
          })),
        resetTraceFilters: () => set({ traceFilters: DEFAULT_TRACE_FILTERS }),

        // 시간 범위
        timeRange: {
          startTime: Date.now() - 3600000, // 1시간 전
          endTime: Date.now(),
        },
        setTimeRange: (startTime, endTime) =>
          set({ timeRange: { startTime, endTime } }),

        // 선택된 항목
        selectedTraceId: null,
        setSelectedTraceId: (id) => set({ selectedTraceId: id }),

        selectedLogId: null,
        setSelectedLogId: (id) => set({ selectedLogId: id }),

        selectedService: null,
        setSelectedService: (name) => set({ selectedService: name }),
      }),
      {
        name: "telemetry-filter-storage",
        partialize: (state) => ({
          logFilters: state.logFilters,
          traceFilters: state.traceFilters,
          timeRange: state.timeRange,
        }),
      },
    ),
  ),
);

// 텔레메트리 데이터 스토어
interface TelemetryStore {
  // 트레이스 데이터
  traces: TraceItem[];
  setTraces: (traces: TraceItem[]) => void;
  addTraces: (traces: TraceItem[]) => void;
  clearTraces: () => void;

  isLoadingTraces: boolean;
  setIsLoadingTraces: (isLoading: boolean) => void;
}

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

  })),
);
