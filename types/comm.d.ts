// 기본 상태 타입 정의
type LoadingState = "idle" | "loading" | "success" | "error";

// 필터 선택 타입
type SelectFilter = "all" | Set<string>;

// 시간 범위 매핑 (밀리초)
const TIME_RANGE_MS: Record<TimeRangeOption, number> = {
  "1m": 60 * 1000,
  "5m": 5 * 60 * 1000,
  "10m": 10 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "3h": 3 * 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
};
