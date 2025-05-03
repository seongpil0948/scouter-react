// 기본 상태 타입 정의
export type LoadingState = "idle" | "loading" | "success" | "error";

// 시간 범위 관련 타입
export type TimeRangeOption =
  | "1m" // 1 minute
  | "5m" // 5 minutes
  | "10m" // 10 minutes
  | "1h" // 1 hour
  | "3h" // 3 hours
  | "6h" // 6 hours
  | "12h" // 12 hours
  | "1d"; // 1 day

// 새로고침 간격 옵션 (밀리초)
export type RefreshIntervalOption =
  | 5 // 5 seconds
  | 10 // 10 seconds
  | 30 // 30 seconds
  | 60; // 60 seconds

// 실시간 범위 옵션 (분)
export type RealtimeRangeOption =
  | 1 // 1 minute
  | 5 // 5 minutes
  | 10 // 10 minutes
  | 15 // 15 minutes
  | 30; // 30 minutes

// 페이지네이션 옵션
export type LimitOption = 50 | 100 | 200 | 500 | 1000;

// 정렬 필드
export type SortField =
  | "startTime"
  | "duration"
  | "serviceName"
  | "status"
  | "name";

// 정렬 방향
export type SortDirection = "asc" | "desc";

// 필터 선택 타입
export type SelectFilter = "all" | Set<string>;

// 시간 범위 매핑 (밀리초)
export const TIME_RANGE_MS: Record<TimeRangeOption, number> = {
  "1m": 60 * 1000,
  "5m": 5 * 60 * 1000,
  "10m": 10 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "3h": 3 * 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
};
