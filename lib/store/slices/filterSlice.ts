import { StateCreator } from "zustand";

export interface FilterSlice {
  // 검색어
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // 서비스 필터
  selectedServices: string[];
  setSelectedServices: (services: string[]) => void;
  addService: (service: string) => void;
  removeService: (service: string) => void;
  clearServices: () => void;

  // 상태 필터
  selectedStatuses: ("OK" | "ERROR" | "UNSET")[];
  setSelectedStatuses: (statuses: ("OK" | "ERROR" | "UNSET")[]) => void;
  addStatus: (status: "OK" | "ERROR" | "UNSET") => void;
  removeStatus: (status: "OK" | "ERROR" | "UNSET") => void;
  clearStatuses: () => void;

  // 지연 시간 필터
  minDuration?: number;
  maxDuration?: number;
  setMinDuration: (duration?: number) => void;
  setMaxDuration: (duration?: number) => void;

  // 속성 키 필터
  attributeKey: string;
  setAttributeKey: (key: string) => void;

  // 루트 스팬만 조회 필터
  rootSpansOnly: boolean;
  setRootSpansOnly: (rootOnly: boolean) => void;

  // 정렬 설정
  sortField: SortField;
  sortDirection: SortDirection;
  setSorting: (field: SortField, direction: SortDirection) => void;

  // 필터 활성화 확인
  hasActiveFilters: () => boolean;

  // 전체 필터 초기화
  resetAllFilters: () => void;

  // 리프레시 트리거
  lastRefreshed: number;
  triggerRefresh: () => void;
}

// 기본 필터 값
const DEFAULT_FILTERS = {
  searchQuery: "",
  selectedServices: [],
  selectedStatuses: [],
  minDuration: undefined,
  maxDuration: undefined,
  attributeKey: "",
  rootSpansOnly: true,
  sortField: "startTime" as SortField,
  sortDirection: "desc" as SortDirection,
  lastRefreshed: Date.now(),
};

export const createFilterSlice: StateCreator<
  FilterSlice,
  [],
  [],
  FilterSlice
> = (set, get) => ({
  ...DEFAULT_FILTERS,

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    // Search query updated
  },

  setSelectedServices: (services) => {
    set({ selectedServices: services });
    // Selected services updated
  },

  addService: (service) =>
    set((state) => {
      if (state.selectedServices.includes(service)) return state;
      return {
        selectedServices: [...state.selectedServices, service],
      };
    }),

  removeService: (service) =>
    set((state) => ({
      selectedServices: state.selectedServices.filter((s) => s !== service),
    })),

  clearServices: () => set({ selectedServices: [] }),

  setSelectedStatuses: (statuses) => {
    set({ selectedStatuses: statuses });
    // Selected statuses updated
  },

  addStatus: (status) =>
    set((state) => {
      if (state.selectedStatuses.includes(status)) return state;
      return {
        selectedStatuses: [...state.selectedStatuses, status],
      };
    }),

  removeStatus: (status) =>
    set((state) => ({
      selectedStatuses: state.selectedStatuses.filter((s) => s !== status),
    })),

  clearStatuses: () => set({ selectedStatuses: [] }),

  setMinDuration: (duration) => {
    set({ minDuration: duration });
    // Min duration updated
  },

  setMaxDuration: (duration) => {
    set({ maxDuration: duration });
    // Max duration updated
  },

  setAttributeKey: (key) => {
    const trimmedKey = key.trim();
    set({ attributeKey: trimmedKey });
    // Attribute key updated
  },

  setRootSpansOnly: (rootOnly) => {
    set({ rootSpansOnly: rootOnly });
    // Root spans only updated
  },

  setSorting: (field, direction) =>
    set({
      sortField: field,
      sortDirection: direction,
    }),

  hasActiveFilters: () => {
    const state = get();
    return (
      state.selectedServices.length > 0 ||
      state.selectedStatuses.length > 0 ||
      state.searchQuery !== "" ||
      state.attributeKey !== "" ||
      state.minDuration !== undefined ||
      state.maxDuration !== undefined ||
      state.rootSpansOnly !== DEFAULT_FILTERS.rootSpansOnly ||
      state.sortField !== DEFAULT_FILTERS.sortField ||
      state.sortDirection !== DEFAULT_FILTERS.sortDirection
    );
  },

  resetAllFilters: () => {
    // Resetting all filters to defaults
    set({
      ...DEFAULT_FILTERS,
      lastRefreshed: Date.now(),
    });
  },

  triggerRefresh: () => {
    set({ lastRefreshed: Date.now() });
    // Refresh triggered
  },
});
