// lib/store/chartStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { createChartConfigSlice } from "./slices/chartConfigSlice";

// 기본 필터값
const DEFAULT_FILTER = Object.freeze({
  minDuration: undefined,
  maxDuration: undefined,
  serviceFilter: "all" as SelectFilter,
  statusFilter: "all" as SelectFilter,
});

// 차트 스토어 생성
export const useChartStore = create<ChartStoreState>()(
  devtools(
    persist(
      (set, get, api) => ({
        // 차트 설정 슬라이스 연결
        ...createChartConfigSlice(set, get, api),

        // 선택된 트레이스 초기화
        selectedTrace: null,
        setSelectedTrace: (trace) => set({ selectedTrace: trace }),

        // 범례 상태 초기화
        legendState: {
          normal: true,
          highLatency: true,
        },
        toggleLegend: (type) =>
          set((state) => ({
            legendState: {
              ...state.legendState,
              [type]: !state.legendState[type],
            },
          })),

        // 데이터 필터 초기화
        dataFilters: DEFAULT_FILTER,
        updateDataFilters: (filters) => {
          const currentFilters = get().dataFilters;
          const hasChanges = Object.keys(filters).some((key) => {
            // @ts-ignore - 동적 속성 접근
            return filters[key] !== currentFilters[key];
          });

          if (hasChanges) {
            set((state) => ({
              dataFilters: { ...state.dataFilters, ...filters },
            }));
          }
        },
        resetFilters: () => set({ dataFilters: DEFAULT_FILTER }),
      }),
      {
        name: "chart-store",
        partialize: (state) => ({
          config: state.config,
          legendState: state.legendState,
        }),
      }
    )
  )
);

export default useChartStore;
