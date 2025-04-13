// lib/store/traceFilterStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { TIME_RANGE_MS } from "./chartStore";

// 트레이스 결과 표시 개수 옵션
export type LimitOption = 50 | 100 | 200 | 500 | 1000;

// 정렬 필드 타입
export type SortField = 
  | 'startTime' 
  | 'duration' 
  | 'serviceName' 
  | 'status'
  | 'name';

// 정렬 방향 타입
export type SortDirection = 'asc' | 'desc';

// 트레이스 필터 스토어 인터페이스
interface TraceFilterStore {
  // 검색어
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // 결과 표시 개수 제한
  limit: LimitOption;
  setLimit: (limit: LimitOption) => void;
  
  // 서비스 필터
  selectedServices: string[];
  setSelectedServices: (services: string[]) => void;
  addService: (service: string) => void;
  removeService: (service: string) => void;
  clearServices: () => void;
  
  // 상태 필터
  selectedStatuses: ('OK' | 'ERROR' | 'UNSET')[];
  setSelectedStatuses: (statuses: ('OK' | 'ERROR' | 'UNSET')[]) => void;
  addStatus: (status: 'OK' | 'ERROR' | 'UNSET') => void;
  removeStatus: (status: 'OK' | 'ERROR' | 'UNSET') => void;
  clearStatuses: () => void;
  
  // 최소/최대 지연 시간
  minDuration?: number;
  maxDuration?: number;
  setMinDuration: (duration?: number) => void;
  setMaxDuration: (duration?: number) => void;
  
  // 속성 키 필터
  attributeKey: string;
  setAttributeKey: (key: string) => void;
  
  // 루트 스팬만 조회 필터 추가
  rootSpansOnly: boolean;
  setRootSpansOnly: (rootOnly: boolean) => void;
  
  // 시간 범위 (빠른 선택 옵션)
  timeRangeOption: keyof typeof TIME_RANGE_MS;
  setTimeRangeOption: (option: keyof typeof TIME_RANGE_MS) => void;
  
  // 정렬 설정
  sortField: SortField;
  sortDirection: SortDirection;
  setSorting: (field: SortField, direction: SortDirection) => void;
  
  // 전체 필터 초기화
  resetAllFilters: () => void;
  
  // API 요청 시간
  lastRefreshed: number;
  refreshData: () => void;
  
  // 필터 적용 여부 확인 - UI 표시용
  hasActiveFilters: () => boolean;
}

// 기본 필터 설정
const DEFAULT_FILTERS = {
  searchQuery: '',
  limit: 100 as LimitOption,
  selectedServices: [],
  selectedStatuses: [],
  minDuration: undefined,
  maxDuration: undefined,
  attributeKey: '',
  rootSpansOnly: true, // 기본값은 루트 스팬만 조회
  timeRangeOption: '1h' as keyof typeof TIME_RANGE_MS,
  sortField: 'startTime' as SortField,
  sortDirection: 'desc' as SortDirection,
  lastRefreshed: Date.now(),
};

// Zustand 스토어 생성
export const useTraceFilterStore = create<TraceFilterStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 기본값 설정
        ...DEFAULT_FILTERS,
        
        // 검색어 변경
        setSearchQuery: (query) => set({ searchQuery: query }),
        
        // 표시 개수 제한 변경
        setLimit: (limit) => set({ limit }),
        
        // 서비스 필터 처리
        setSelectedServices: (services) => set({ selectedServices: services }),
        addService: (service) => set((state) => ({
          selectedServices: [...state.selectedServices, service]
        })),
        removeService: (service) => set((state) => ({
          selectedServices: state.selectedServices.filter(s => s !== service)
        })),
        clearServices: () => set({ selectedServices: [] }),
        
        // 상태 필터 처리
        setSelectedStatuses: (statuses) => set({ selectedStatuses: statuses }),
        addStatus: (status) => set((state) => ({
          selectedStatuses: [...state.selectedStatuses, status]
        })),
        removeStatus: (status) => set((state) => ({
          selectedStatuses: state.selectedStatuses.filter(s => s !== status)
        })),
        clearStatuses: () => set({ selectedStatuses: [] }),
        
        // 지연 시간 필터
        setMinDuration: (duration) => set({ minDuration: duration }),
        setMaxDuration: (duration) => set({ maxDuration: duration }),
        
        // 속성 키 필터
        setAttributeKey: (key) => set({ attributeKey: key }),
        
        // 루트 스팬만 조회 필터
        setRootSpansOnly: (rootOnly) => set({ rootSpansOnly: rootOnly }),
        
        // 시간 범위 옵션
        setTimeRangeOption: (option) => set({ timeRangeOption: option }),
        
        // 정렬 설정
        setSorting: (field, direction) => set({ 
          sortField: field, 
          sortDirection: direction 
        }),
        
        // 전체 필터 초기화
        resetAllFilters: () => set({ 
          ...DEFAULT_FILTERS,
          lastRefreshed: Date.now()
        }),
        
        refreshData: () => set({ lastRefreshed: Date.now() }),
        
        // 활성 필터 여부 확인 (UI 표시용)
        hasActiveFilters: () => {
          const state = get();
          return state.selectedServices.length > 0 ||
                 state.selectedStatuses.length > 0 ||
                 state.searchQuery !== '' ||
                 state.attributeKey !== '' ||
                 state.minDuration !== undefined ||
                 state.maxDuration !== undefined ||
                 state.rootSpansOnly !== DEFAULT_FILTERS.rootSpansOnly ||
                 state.limit !== DEFAULT_FILTERS.limit;
        }
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
          timeRangeOption: state.timeRangeOption,
          sortField: state.sortField,
          sortDirection: state.sortDirection,
        }),
      }
    )
  )
);