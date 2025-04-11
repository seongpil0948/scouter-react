// 로그 아이템 인터페이스
interface LogItem {
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
interface TraceItem {
  id: string;
  traceId: string;
  name: string;
  startTime: number;
  duration: number;
  serviceName: string;
  spanCount?: number;
  status?: 'UNSET' | 'ERROR' | 'OK';
  attributes?: Record<string, any>;
  services?: string[];
}

// 서비스 메트릭 인터페이스
interface ServiceMetric {
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
interface LogFilters {
  service: string | null;
  severity: string | null;
  search: string;
  hasTrace: boolean;
  startTime?: number;
  endTime?: number;
}

interface TraceFilters {
  service: string | null;
  status: string | null;
  search: string;
  minDuration?: number;
  maxDuration?: number;
  startTime?: number;
  endTime?: number;
  attributeKey?: string | null;
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
