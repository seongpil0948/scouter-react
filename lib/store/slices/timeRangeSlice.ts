import { StateCreator } from "zustand";

// 시간 범위 상수 (ms 단위)
export const TIME_RANGE_MS: Record<TimeRangeOption, number> = {
  "15m": 15 * 60 * 1000,
  "30m": 30 * 60 * 1000,
  "1h": 1 * 60 * 60 * 1000,
  "3h": 3 * 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  // 'custom' is handled separately, so we can set it to 0 or ignore it in calculations
  custom: 0,
};

export interface TimeRangeSlice {
  // 시간 범위
  timeRange: {
    startTime: number;
    endTime: number;
  };
  setTimeRange: (startTime: number, endTime: number) => boolean;

  // 실시간 모드 설정
  isRealtime: boolean;
  setIsRealtime: (isRealtime: boolean) => void;
  toggleRealtime: (enabled?: boolean) => void;

  // 빠른 시간 범위 선택
  timeRangeOption: TimeRangeOption;
  setCurrentTimeRangeToDefault: () => void;
  setTimeRangeOption: (option: TimeRangeOption) => void;

  // 실시간 갱신 설정
  refreshInterval: RefreshIntervalOption;
  setRefreshInterval: (interval: RefreshIntervalOption) => void;

  // 실시간 조회 범위
  realtimeRange: RealtimeRangeOption;
  setRealtimeRange: (range: RealtimeRangeOption) => void;
}

// 기본 시간 범위 설정 (1시간 전 ~ 현재)
const getDefaultTimeRange = () => {
  const now = Date.now();
  return {
    startTime: now - 3600000, // 1 hour ago
    endTime: now,
  };
};

export const createTimeRangeSlice: StateCreator<
  TimeRangeSlice,
  [],
  [],
  TimeRangeSlice
> = (set, get) => ({
  timeRange: getDefaultTimeRange(),
  setTimeRange: (startTime, endTime) => {
    // 유효성 검사
    if (
      typeof startTime !== "number" ||
      typeof endTime !== "number" ||
      startTime <= 0 ||
      endTime <= 0 ||
      startTime >= endTime
    ) {
      // Invalid time range, resetting to defaults
      const defaultRange = getDefaultTimeRange();
      startTime = defaultRange.startTime;
      endTime = defaultRange.endTime;
    }

    // 변경 감지 (1초 이상 차이가 있는 경우만 업데이트)
    const prevTimeRange = get().timeRange;
    const hasChanged =
      Math.abs(prevTimeRange.startTime - startTime) > 1000 ||
      Math.abs(prevTimeRange.endTime - endTime) > 1000;

    if (hasChanged) {
      // Time range updated
      set({ timeRange: { startTime, endTime } });
      return true;
    }

    return false;
  },

  isRealtime: false,
  setIsRealtime: (isRealtime) => set({ isRealtime }),
  toggleRealtime: (enabled) => {
    const currentIsRealtime = get().isRealtime;
    const newIsRealtime = enabled !== undefined ? enabled : !currentIsRealtime;

    // 변경 없으면 무시
    if (newIsRealtime === currentIsRealtime) return;

    console.log(
      `[TimeRangeSlice] Realtime mode ${newIsRealtime ? "enabled" : "disabled"}`
    );

    // 실시간 모드 활성화 시 시간 범위 업데이트
    if (newIsRealtime) {
      const now = Date.now();
      const rangeInMs = get().realtimeRange * 60 * 1000;

      set({
        isRealtime: true,
        timeRange: {
          startTime: now - rangeInMs,
          endTime: now,
        },
      });
    } else {
      // 비활성화만 수행
      set({ isRealtime: false });
    }
  },

  timeRangeOption: "1h",
  setCurrentTimeRangeToDefault: () => {
    const defaultRange = getDefaultTimeRange();
    get().setTimeRange(defaultRange.startTime, defaultRange.endTime);
  },
  setTimeRangeOption: (option) => {
    set({ timeRangeOption: option });

    // 시간 범위 옵션에 따라 시간 범위 업데이트
    const now = Date.now();
    const duration = TIME_RANGE_MS[option];

    get().setTimeRange(now - duration, now);
  },

  refreshInterval: 5,
  setRefreshInterval: (interval) => set({ refreshInterval: interval }),

  realtimeRange: 5,
  setRealtimeRange: (range) => set({ realtimeRange: range }),
});
