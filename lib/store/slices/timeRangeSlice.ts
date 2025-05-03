import { StateCreator } from "zustand";
import {
  TimeRangeOption,
  RefreshIntervalOption,
  RealtimeRangeOption,
  TIME_RANGE_MS,
} from "./commonTypes";

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
      console.warn("[TimeRangeSlice] Invalid time range:", {
        startTime,
        endTime,
      });

      // 유효하지 않은 경우 기본 범위로 설정
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
      console.log(
        `[TimeRangeSlice] Time range updated: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}`
      );

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
