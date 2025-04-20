interface TelemetryStore {
  // 트레이스 데이터
  traces: TraceItem[];
  setTraces: (traces: TraceItem[]) => void;
  addTraces: (traces: TraceItem[]) => void;
  clearTraces: () => void;

  isLoadingTraces: boolean;
  setIsLoadingTraces: (isLoading: boolean) => void;
}

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

type RefreshIntervalOption = 5 | 10 | 30 | 60;
type RealtimeRangeOption = 1 | 5 | 10 | 15 | 30;
