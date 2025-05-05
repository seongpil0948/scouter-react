// types/log.d.ts
// 로그 항목 인터페이스
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

// 로그 필터 인터페이스
interface LogFilter {
  startTime: number;
  endTime: number;
  serviceName?: string | null;
  severity?: string | null;
  hasTrace?: boolean;
  query?: string;
  limit: number;
  offset: number;
}

// 서비스 집계 타입
interface ServiceAggregation {
  name: string;
  count: number;
}

// 심각도 집계 타입
interface SeverityAggregation {
  name: string;
  count: number;
}

// 로그 API 응답 데이터 타입
interface LogsData {
  logs: LogItem[];
  pagination: Pagination;
  timeRange: TimeRange;
  services: string[];
  severities: string[];
}

// 로그 API 응답 타입
type LogsResponse = ApiResponse<LogsData>;

// 로그 요약 데이터 타입
interface LogSummaryData {
  services: ServiceAggregation[];
  severities: SeverityAggregation[];
  timeRange: TimeRange;
}

// 로그 요약 API 응답 타입
type LogSummaryResponse = ApiResponse<LogSummaryData>;

// 로그 스토어 상태 인터페이스
interface LogStoreState {
  logs: LogItem[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  selectedLogId: string | null;
  filters: LogFilter;
  setFilters: (filters: Partial<LogFilter>) => void;
  setPage: (page: number) => void;
  fetchLogs: (force?: boolean) => Promise<void>;
  setSelectedLogId: (id: string | null) => void;
}
