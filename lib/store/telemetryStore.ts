// lib/store/telemetryStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { createLoadingSlice, LoadingSlice } from "./slices/loadingSlice";
import { createTimeRangeSlice, TimeRangeSlice } from "./slices/timeRangeSlice";
import { createRealtimeSlice, RealtimeSlice } from "./slices/realtimeSlice";

// 필요한 슬라이스들을 합쳐서 전체 스토어 타입 정의
export interface TelemetryStoreState
  extends LoadingSlice,
    TimeRangeSlice,
    RealtimeSlice {
  // 추가적인 원격 측정 관련 상태나 액션
  selectedTraceId: string | null;
  setSelectedTraceId: (id: string | null) => void;

  selectedLogId: string | null;
  setSelectedLogId: (id: string | null) => void;

  selectedService: string | null;
  setSelectedService: (name: string | null) => void;
}

// 원격 측정 스토어 생성
export const useFilterStore = create<TelemetryStoreState>()(
  devtools(
    persist(
      (set, get, api) => ({
        // 각 슬라이스 연결
        ...createLoadingSlice(set, get, api),
        ...createTimeRangeSlice(set, get, api),
        ...createRealtimeSlice(set, get, api),

        // 추가 상태와 액션
        selectedTraceId: null,
        setSelectedTraceId: (id) => set({ selectedTraceId: id }),

        selectedLogId: null,
        setSelectedLogId: (id) => set({ selectedLogId: id }),

        selectedService: null,
        setSelectedService: (name) => set({ selectedService: name }),
      }),
      {
        name: "telemetry-filter-storage",
        partialize: (state) => ({
          // 영속화할 상태만 선택
          timeRange: state.timeRange,
          refreshInterval: state.refreshInterval,
          realtimeRange: state.realtimeRange,
          isRealtime: false, // 항상 실시간 모드 비활성화로 시작
        }),
      }
    )
  )
);

export default useFilterStore;
