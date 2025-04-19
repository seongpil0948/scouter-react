type LimitOption = 50 | 100 | 200 | 500 | 1000;

type SortField = 
  | 'startTime' 
  | 'duration' 
  | 'serviceName' 
  | 'status'
  | 'name';

type SortDirection = 'asc' | 'desc';


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
