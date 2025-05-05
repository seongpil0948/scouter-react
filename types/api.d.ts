// types/api.d.ts
// 트레이스 목록 데이터 타입
interface TraceListData {
  traces: TraceItem[];
  pagination: Pagination;
  timeRange: TimeRange;
  services: string[];
  totalDuration: number;
  rootSpansOnly?: boolean;
}
type TracesResponse = ApiResponse<TraceListData>;

// 트레이스 상세 데이터 타입
interface TraceDetailData {
  trace: {
    traceId: string;
    spans: Span[];
    startTime: number;
    endTime: number;
    services: string[];
    total: number;
  };
}
// 트레이스 상세 응답 타입
type TraceDetailResponse = ApiResponse<TraceDetailData>;

// 서비스 항목 타입
interface ServiceItem {
  name: string;
  requestCount: number;
  errorCount: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
}

// 서비스 목록 데이터 타입
interface ServiceListData {
  services: ServiceItem[];
  timeRange: TimeRange;
  totalRequests: number;
  totalErrors: number;
  avgLatency: number;
  errorPercentage: number;
}

// 서비스 목록 응답 타입
type ServicesResponse = ApiResponse<ServiceListData>;

// 트레이스 서비스 항목 타입
interface TraceServiceItem {
  name: string;
  count: number;
  errorCount: number;
  errorRate: number;
  avgLatency: number;
}

// 트레이스 서비스 목록 데이터 타입
interface TraceServiceListData {
  services: TraceServiceItem[];
  total: number;
  took: number;
}

// 트레이스 서비스 응답 타입
type TraceServiceResponse = ApiResponse<TraceServiceListData>;

// 메트릭 데이터 타입
interface MetricsData {
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
  timeRange: TimeRange;
}

// 메트릭 응답 타입
type MetricsResponse = ApiResponse<MetricsData>;
