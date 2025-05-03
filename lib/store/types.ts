// 원격 측정 데이터 타입 정의
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

// 스팬 인터페이스
export interface Span {
  id: string;
  name: string;
  serviceName: string;
  startTime: number;
  endTime: number;
  duration: number;
  parentSpanId?: string;
  attributes?: Record<string, any>;
  status?: string;
  traceId: string;
  spanId: string;
}

export interface TraceDetailResponse {
  traceId: string;
  spans: Span[];
  startTime: number;
  endTime: number;
  services: string[];
  total: number;
}

// 선택된 트레이스 데이터
export interface SelectedTraceData {
  timestamp: number;
  latency: number;
  serviceName: string;
  status?: string;
  traceId: string;
  name: string;
  traceItem: TraceItem;
}

// Zustand 스토어 미들웨어 타입
export type WithDevtools = Parameters<
  typeof import("zustand/middleware").devtools
>[0];
export type WithPersist = Parameters<
  typeof import("zustand/middleware").persist
>[0];
