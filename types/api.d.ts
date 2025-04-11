// API 응답 타입 정의

// 트레이스 목록 응답 타입
interface TracesResponse {
  traces: TraceItem[];
  total: number;
  limit: number;
  offset: number;
  timeRange: {
    startTime: number;
    endTime: number;
  };
  rootSpansOnly: boolean; // 루트 스팬만 조회 여부 플래그
}

// 트레이스 상세 응답 타입
interface TraceDetailResponse {
  traceId: string;
  spans: Span[];
  startTime: number;
  endTime: number;
  services: string[];
  total: number;
}

// 서비스 목록 응답 타입
interface ServicesResponse {
  services: {
    name: string;
    count: number;
    errorCount: number;
    errorRate: number;
    avgLatency: number;
  }[];
  total: number;
  timeRange: {
    startTime: number;
    endTime: number;
  };
}

// 메트릭 응답 타입
interface MetricsResponse {
  topLatencyServices: {
    name: string;
    requestCount: number;
    errorCount: number;
    errorRate: number;
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
    timeSeriesData: any[];
  }[];
  recentTraces: TraceItem[];
  summary: {
    serviceCount: number;
    totalErrors: number;
    averageLatency: number;
  };
  topErrorServices: {
    name: string;
    errorCount: number;
  }[];
  timeRange: {
    startTime: number;
    endTime: number;
  };
}

// 로그 응답 타입
interface LogsResponse {
  logs: LogItem[];
  services: {
    name: string;
    count: number;
  }[];
  severities: {
    name: string;
    count: number;
  }[];
  total: number;
  took: number;
}

// 에러 응답 타입
interface ErrorResponse {
  error: string;
  details?: string;
}