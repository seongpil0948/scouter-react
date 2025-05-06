import { StateCreator } from "zustand";

export interface LogFilterSlice {
  // 검색어
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // 서비스 필터
  selectedService: string | null;
  setSelectedService: (service: string | null) => void;

  // 심각도(severity) 필터
  selectedSeverity: string | null;
  setSelectedSeverity: (severity: string | null) => void;

  // 트레이스 ID 포함 여부
  hasTrace: boolean;
  setHasTrace: (hasTrace: boolean) => void;

  // 표시 개수 제한
  limit: number;
  setLimit: (limit: number) => void;

  // 필터 활성화 확인
  hasActiveFilters: () => boolean;

  // 전체 필터 초기화
  resetAllFilters: () => void;

  // 새로고침 트리거
  lastRefreshed: number;
  triggerRefresh: () => void;
}

// 기본 필터 값
const DEFAULT_FILTERS = {
  searchQuery: "",
  selectedService: null,
  selectedSeverity: null,
  hasTrace: false,
  limit: 100,
  lastRefreshed: Date.now(),
};

export const createLogFilterSlice: StateCreator<
  LogFilterSlice,
  [],
  [],
  LogFilterSlice
> = (set, get) => ({
  ...DEFAULT_FILTERS,

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSelectedService: (service) => {
    set({ selectedService: service });
  },

  setSelectedSeverity: (severity) => {
    set({ selectedSeverity: severity });
  },

  setHasTrace: (hasTrace) => {
    set({ hasTrace });
  },

  setLimit: (limit) => {
    set({ limit });
  },

  hasActiveFilters: () => {
    const state = get();
    return (
      state.searchQuery !== "" ||
      state.selectedService !== null ||
      state.selectedSeverity !== null ||
      state.hasTrace !== DEFAULT_FILTERS.hasTrace ||
      state.limit !== DEFAULT_FILTERS.limit
    );
  },

  resetAllFilters: () => {
    set({
      ...DEFAULT_FILTERS,
      lastRefreshed: Date.now(),
    });
  },

  triggerRefresh: () => {
    set({ lastRefreshed: Date.now() });
  },
});
