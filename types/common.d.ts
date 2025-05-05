// types/common.d.ts
// 공통 응답 타입 정의
interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

// 페이지네이션 타입
interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

// 시간 범위 타입
interface TimeRange {
  startTime: number;
  endTime: number;
}

// 정렬 필드 타입
type SortField = "startTime" | "duration" | "name" | "serviceName" | "status";

// 정렬 방향 타입
type SortDirection = "asc" | "desc";

// 리미트 옵션 타입
type LimitOption = 10 | 25 | 50 | 100 | 200;

// 시간 범위 옵션 타입
type TimeRangeOption = "15m" | "30m" | "1h" | "3h" | "6h" | "12h" | "24h" | "7d" | "custom";

// 새로고침 간격 옵션 타입
type RefreshIntervalOption = 5 | 10 | 30 | 60;

// 실시간 조회 범위 옵션 타입
type RealtimeRangeOption = 5 | 10 | 15 | 30;

// 필터 타입
type SelectFilter = Set<string> | "all";
