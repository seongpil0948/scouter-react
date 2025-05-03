// types/trace.d.ts

// 스팬 인터페이스 - 단일 작업 또는 API 호출을 나타냄
interface Span {
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

interface Trace {
  traceId: string;
  spans: Span[];
  startTime: number;
  endTime: number;
  services: string[];
  total: number;
}

// 트레이스 상세 정보 인터페이스
interface TraceDetail {
  traceId: string;
  spans: Span[];
  startTime: number;
  endTime: number;
  services: string[];
  total: number;
}

// 스팬 노드 인터페이스 (계층 구조 표현용)
interface SpanNode {
  span: Span;
  children: SpanNode[];
  depth: number;
}

// 스팬 타임라인 아이템 인터페이스
interface TimelineItem {
  id: string;
  spanId: string;
  name: string;
  serviceName: string;
  start: number; // 전체 타임라인 기준 시작 위치 (0-100%)
  width: number; // 전체 타임라인 기준 너비 (0-100%)
  duration: string; // 포맷팅된 지연 시간
  status: string;
  depth: number;
  hasChildren: boolean;
}

// 스팬 상태 유형
type SpanStatus = "OK" | "ERROR" | "UNSET";

// 스팬 필터 인터페이스
interface SpanFilter {
  serviceName?: string;
  status?: SpanStatus;
  minDuration?: number;
  maxDuration?: number;
  searchText?: string;
}

// 데이터 포인트 타입
type DataPoint = [number, number]; // [timestamp, latency]

// 시각화 업데이트 방식
type VisualizationUpdateMode = "realtime" | "batch" | "manual";

// 시계열 데이터 인터페이스
interface TimeSeriesData {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

// 트레이스 시각화 데이터 구조
interface TraceVisualizationData {
  timeSeriesData: DataPoint[];
  highLatencyData: DataPoint[];
  spanCounts: Record<string, number>; // 서비스별 스팬 카운트
  errorCounts: Record<string, number>; // 서비스별 오류 카운트
  latencyDistribution: Record<string, number[]>; // 서비스별 지연 시간 분포
}

// 트레이스 API 응답 타입
interface TraceApiResponse {
  traceId: string;
  spans: Span[];
  startTime: number;
  endTime: number;
  services: string[];
  total: number;
}

// 범례 아이템 타입
interface LegendItem {
  label: string;
  color: string;
  isActive: boolean;
  onClick?: () => void;
}
