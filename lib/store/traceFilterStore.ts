import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { createFilterSlice, FilterSlice } from "./slices/filterSlice";

// 트레이스 필터 스토어 타입
export interface TraceFilterStore extends FilterSlice {
  // 추가 필터 옵션
  limit: LimitOption;
  setLimit: (limit: LimitOption) => void;

  // 정렬 설정
  sortField: SortField;
  sortDirection: SortDirection;
  setSorting: (field: SortField, direction: SortDirection) => void;
}

// 기본 필터 값
const DEFAULT_FILTERS = {
  searchQuery: "",
  limit: 500 as LimitOption,
  selectedServices: [],
  selectedStatuses: [],
  minDuration: undefined,
  maxDuration: undefined,
  attributeKey: "",
  rootSpansOnly: true,
  timeRangeOption: "1h",
  sortField: "startTime" as SortField,
  sortDirection: "desc" as SortDirection,
  lastRefreshed: Date.now(),
};

// 트레이스 필터 스토어 생성
export const useTraceFilterStore = create<TraceFilterStore>()(
  devtools(
    persist(
      (set, get, api) => ({
        ...createFilterSlice(set, get, api),

        // 추가 속성 및 액션
        limit: DEFAULT_FILTERS.limit,
        setLimit: (limit) => {
          set({ limit });
        },

        setSorting: (field, direction) => {
          set({
            sortField: field,
            sortDirection: direction,
          });
        },
      }),
      {
        name: "trace-filter-storage",
        partialize: (state) => ({
          searchQuery: state.searchQuery,
          limit: state.limit,
          selectedServices: state.selectedServices,
          selectedStatuses: state.selectedStatuses,
          minDuration: state.minDuration,
          maxDuration: state.maxDuration,
          attributeKey: state.attributeKey,
          rootSpansOnly: state.rootSpansOnly,
          sortField: state.sortField,
          sortDirection: state.sortDirection,
        }),
      }
    )
  )
);

export default useTraceFilterStore;
