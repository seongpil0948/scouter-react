// app/lib/store/telemetryStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// 로그 아이템 인터페이스
export interface LogItem {
  id: string;
  timestamp: number;
  serviceName: string;
  message: string;
  severity: string;
  traceId?: string;
  spanId?: string;
  attributes?: Record<string, any>;
}

// 트레이스 아이템 인터페이스
export interface TraceItem {
  id: string;
  traceId: string;
  name: string;
  startTime: number;
  duration: number;
  serviceName: string;
  spanCount?: number;
  status?: string;
  attributes?: Record<string, any>;
  services?: string[];
}

// 서비스 메트릭 인터페이스
export interface ServiceMetric {
  name: string;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  timeSeriesData?: Array<{
    timestamp: number;
    requestCount: number;
    avgLatency: number;
    errorCount: number;
    errorRate: number;
  }>;
}

// 필터 인터페이스
export interface LogFilters {
  service: string | null;
  severity: string | null;
  search: string;
  hasTrace: boolean;
  startTime?: number;
  endTime?: number;
}

export interface TraceFilters {
  service: string | null;
  status: string | null;
  search: string;
  minDuration?: number;
  maxDuration?: number;
  startTime?: number;
  endTime?: number;
}

// 필터 스토어 타입
interface FilterStore {
  // 로그 필터
  logFilters: LogFilters;
  setLogFilters: (filters: Partial<LogFilters>) => void;
  resetLogFilters: () => void;

  // 트레이스 필터
  traceFilters: TraceFilters;
  setTraceFilters: (filters: Partial<TraceFilters>) => void;
  resetTraceFilters: () => void;

  // 시간 범위
  timeRange: {
    startTime: number;
    endTime: number;
  };
  setTimeRange: (startTime: number, endTime: number) => void;

  // 선택된 항목
  selectedTraceId: string | null;
  setSelectedTraceId: (id: string | null) => void;

  selectedLogId: string | null;
  setSelectedLogId: (id: string | null) => void;

  selectedService: string | null;
  setSelectedService: (name: string | null) => void;
}

// 기본 필터 값
const DEFAULT_LOG_FILTERS: LogFilters = {
  service: null,
  severity: null,
  search: "",
  hasTrace: false,
  startTime: Date.now() - 3600000, // 1시간 전
  endTime: Date.now(),
};

const DEFAULT_TRACE_FILTERS: TraceFilters = {
  service: null,
  status: null,
  search: "",
  startTime: Date.now() - 3600000, // 1시간 전
  endTime: Date.now(),
};

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
  // 로그 데이터
  logs: LogItem[];
  setLogs: (logs: LogItem[]) => void;
  addLogs: (logs: LogItem[]) => void;
  clearLogs: () => void;

  // 트레이스 데이터
  traces: TraceItem[];
  setTraces: (traces: TraceItem[]) => void;
  addTraces: (traces: TraceItem[]) => void;
  clearTraces: () => void;

  // 서비스 메트릭 데이터
  services: ServiceMetric[];
  setServices: (services: ServiceMetric[]) => void;

  // 로딩 상태
  isLoadingLogs: boolean;
  setIsLoadingLogs: (isLoading: boolean) => void;

  isLoadingTraces: boolean;
  setIsLoadingTraces: (isLoading: boolean) => void;

  isLoadingServices: boolean;
  setIsLoadingServices: (isLoading: boolean) => void;
}

export const useTelemetryStore = create<TelemetryStore>()(
  devtools((set) => ({
    // 로그 데이터
    logs: [],
    setLogs: (logs) => set({ logs }),
    addLogs: (logs) =>
      set((state) => ({
        logs: [...state.logs, ...logs],
      })),
    clearLogs: () => set({ logs: [] }),

    // 트레이스 데이터
    traces: [],
    setTraces: (traces) => set({ traces }),
    addTraces: (traces) =>
      set((state) => ({
        traces: [...state.traces, ...traces],
      })),
    clearTraces: () => set({ traces: [] }),

    // 서비스 메트릭 데이터
    services: [],
    setServices: (services) => set({ services }),

    // 로딩 상태
    isLoadingLogs: false,
    setIsLoadingLogs: (isLoadingLogs) => set({ isLoadingLogs }),

    isLoadingTraces: false,
    setIsLoadingTraces: (isLoadingTraces) => set({ isLoadingTraces }),

    isLoadingServices: false,
    setIsLoadingServices: (isLoadingServices) => set({ isLoadingServices }),
  })),
);
