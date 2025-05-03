import { StateCreator } from "zustand";
import { RefreshIntervalOption, RealtimeRangeOption } from "./commonTypes";

export interface RealtimeSlice {
  // 실시간 모드 설정
  isRealtime: boolean;
  setIsRealtime: (isRealtime: boolean) => void;
  toggleRealtime: (enabled?: boolean) => void;

  // 실시간 갱신 설정
  refreshInterval: RefreshIntervalOption;
  setRefreshInterval: (interval: RefreshIntervalOption) => void;

  // 실시간 조회 범위
  realtimeRange: RealtimeRangeOption;
  setRealtimeRange: (range: RealtimeRangeOption) => void;

  // 실시간 데이터 갱신 관련
  isRefreshing: boolean;
  setRefreshing: (isRefreshing: boolean) => void;
  lastRefreshTime: number;

  // 실시간 시간 범위 업데이트
  updateRealtimeTimeRange: () => { startTime: number; endTime: number };

  // 실시간 모드 전환 시 시간 범위 및 기타 설정 처리
  enableRealtimeMode: () => void;
  disableRealtimeMode: () => void;
}

export const createRealtimeSlice: StateCreator<
  RealtimeSlice,
  [],
  [],
  RealtimeSlice
> = (set, get) => ({
  // 실시간 모드 상태
  isRealtime: false,
  setIsRealtime: (isRealtime) => {
    // 이전 상태와 동일하면 변경하지 않음
    if (get().isRealtime === isRealtime) return;

    // 모드에 따라 적절한 메서드 호출
    if (isRealtime) {
      get().enableRealtimeMode();
    } else {
      get().disableRealtimeMode();
    }
  },

  // 실시간 모드 토글
  toggleRealtime: (enabled) => {
    const currentIsRealtime = get().isRealtime;
    const newIsRealtime = enabled !== undefined ? enabled : !currentIsRealtime;

    // 변경 없으면 무시
    if (newIsRealtime === currentIsRealtime) return;

    console.log(
      `[RealtimeSlice] Realtime mode ${newIsRealtime ? "enabled" : "disabled"}`
    );

    get().setIsRealtime(newIsRealtime);
  },

  // 새로고침 간격 (초 단위)
  refreshInterval: 5,
  setRefreshInterval: (interval) => set({ refreshInterval: interval }),

  // 실시간 조회 범위 (분 단위)
  realtimeRange: 5,
  setRealtimeRange: (range) => {
    set({ realtimeRange: range });

    // 실시간 모드 활성화 상태에서 범위가 변경되면 시간 범위도 업데이트
    if (get().isRealtime) {
      get().updateRealtimeTimeRange();
    }
  },

  // 데이터 새로고침 상태
  isRefreshing: false,
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  lastRefreshTime: Date.now(),

  // 실시간 시간 범위 업데이트
  updateRealtimeTimeRange: () => {
    const now = Date.now();
    const rangeInMs = get().realtimeRange * 60 * 1000; // 분 -> 밀리초 변환

    const timeRange = {
      startTime: now - rangeInMs,
      endTime: now,
    };

    // 시간 범위만 반환 (실제 적용은 timeRangeSlice와 연동 필요)
    return timeRange;
  },

  // 실시간 모드 활성화
  enableRealtimeMode: () => {
    const timeRange = get().updateRealtimeTimeRange();

    set({
      isRealtime: true,
      lastRefreshTime: Date.now(),
      // timeRange는 telemetryStore에서 관리하므로 여기서는 직접 업데이트하지 않음
    });

    console.log(
      `[RealtimeSlice] Realtime mode enabled with range: ${get().realtimeRange}분`
    );

    return timeRange;
  },

  // 실시간 모드 비활성화
  disableRealtimeMode: () => {
    set({
      isRealtime: false,
      isRefreshing: false,
    });

    console.log("[RealtimeSlice] Realtime mode disabled");
  },
});
