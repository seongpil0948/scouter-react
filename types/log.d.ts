// types/log.d.ts
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

// API 응답 인터페이스
interface LogsResponse {
  logs: LogItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  timeRange: {
    startTime: number;
    endTime: number;
  };
  services: string[];
  severities: string[];
}

interface LogSummary {
  services: ServiceAggregation[];
  severities: SeverityAggregation[];
  timeRange: {
    startTime: number;
    endTime: number;
  };
}

interface ServiceAggregation {
  name: string;
  count: number;
}

interface SeverityAggregation {
  name: string;
  count: number;
}

// 로그 스토어 인터페이스
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
