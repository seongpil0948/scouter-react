/**
 * 전역 필터 상태 관리를 위한 컨텍스트
 */
import React, { createContext, useContext, ReactNode } from "react";
import { useFilterState, FilterState } from "@/lib/hooks";
import { useLocalStorage } from "@/lib/hooks/storage/useLocalStorage";

// 기본 필터 타입 정의
export interface CommonFilterState {
  timeRange: {
    start: number | null;
    end: number | null;
  };
  severity: string[];
  services: string[];
  searchTerm: string;
  [key: string]: any;
}

// 기본 필터 값
const defaultFilters: CommonFilterState = {
  timeRange: {
    start: null,
    end: null,
  },
  severity: [],
  services: [],
  searchTerm: ""
};

// 컨텍스트 타입 정의
interface FilterContextType extends FilterState<CommonFilterState> {
  saveFilterPreset: (name: string) => void;
  loadFilterPreset: (name: string) => void;
  savedPresets: Record<string, CommonFilterState>;
  deleteSavedPreset: (name: string) => void;
}

// 컨텍스트 생성
const FilterContext = createContext<FilterContextType | undefined>(undefined);

// 컨텍스트 프로바이더 Props
interface FilterProviderProps {
  children: ReactNode;
  initialFilters?: Partial<CommonFilterState>;
  storageKey?: string;
}

/**
 * 필터 컨텍스트 제공자 컴포넌트
 */
export function FilterProvider({
  children,
  initialFilters,
  storageKey = "scouter-filters-v1"
}: FilterProviderProps) {
  // 기본 필터에 초기 필터 합치기
  const mergedDefaultFilters = {
    ...defaultFilters,
    ...initialFilters
  };
  
  // 필터 상태 관리 훅 사용
  const filterState = useFilterState<CommonFilterState>(mergedDefaultFilters);
  
  // 로컬 스토리지를 사용한 필터 프리셋 저장
  const { value: savedPresets, setValue: setSavedPresets } = useLocalStorage<Record<string, CommonFilterState>>(
    `${storageKey}-presets`,
    {}
  );
  
  // 현재 필터 상태를 프리셋으로 저장
  const saveFilterPreset = (name: string) => {
    setSavedPresets(prev => ({
      ...prev,
      [name]: { ...filterState.filters }
    }));
  };
  
  // 저장된 프리셋 불러오기
  const loadFilterPreset = (name: string) => {
    const preset = savedPresets[name];
    if (preset) {
      filterState.applyFilters(preset);
    }
  };
  
  // 저장된 프리셋 삭제
  const deleteSavedPreset = (name: string) => {
    setSavedPresets(prev => {
      const newPresets = { ...prev };
      delete newPresets[name];
      return newPresets;
    });
  };
  
  // 컨텍스트 값
  const contextValue: FilterContextType = {
    ...filterState,
    saveFilterPreset,
    loadFilterPreset,
    savedPresets,
    deleteSavedPreset
  };
  
  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
}

/**
 * 필터 컨텍스트 사용 훅
 */
export function useFilterContext() {
  const context = useContext(FilterContext);
  
  if (context === undefined) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  
  return context;
}

export default FilterContext;
