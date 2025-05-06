// types/common.d.ts

// 정렬 필드 타입
type SortField = "startTime" | "duration" | "name" | "serviceName" | "status";

// 정렬 방향 타입
type SortDirection = "asc" | "desc";

// 리미트 옵션 타입
type LimitOption = 50 | 100 | 200 | 500 | 1000;

// 시간 범위 옵션 타입
type TimeRangeOption =
  | "15m"
  | "30m"
  | "1h"
  | "3h"
  | "6h"
  | "12h"
  | "24h"
  | "7d"
  | "custom";

// 새로고침 간격 옵션 타입
type RefreshIntervalOption = 5 | 10 | 30 | 60;

// 실시간 조회 범위 옵션 타입
type RealtimeRangeOption = 1 | 5 | 10 | 15 | 30;

// 필터 타입
type SelectFilter = Set<string> | "all";

// 로딩 상태 타입
type LoadingState = "idle" | "loading" | "success" | "error";
