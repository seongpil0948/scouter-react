/**
 * 필터 상태 관리를 위한 커스텀 훅
 */
import { useState, useCallback, useMemo } from "react";
import { deepEqual } from "@/lib/utils";

export interface FilterState<T = Record<string, any>> {
  filters: T;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  resetFilters: () => void;
  applyFilters: (newFilters: Partial<T>) => void;
  clearFilter: (key: keyof T) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

/**
 * 필터 상태 관리 훅
 * 
 * @param defaultFilters 기본 필터 상태
 * @returns 필터 상태 및 관련 메서드
 */
export function useFilterState<T extends Record<string, any>>(defaultFilters: T): FilterState<T> {
  const [filters, setFilters] = useState<T>(defaultFilters);
  
  // 단일 필터 값 업데이트
  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  // 필터 초기화
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, [defaultFilters]);
  
  // 여러 필터 한 번에 적용
  const applyFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);
  
  // 단일 필터 제거
  const clearFilter = useCallback((key: keyof T) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      newFilters[key] = defaultFilters[key];
      return newFilters;
    });
  }, [defaultFilters]);
  
  // 활성화된 필터 여부 확인
  const hasActiveFilters = useMemo(() => {
    return !deepEqual(filters, defaultFilters);
  }, [filters, defaultFilters]);
  
  // 활성화된 필터 개수
  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.keys(filters).forEach(key => {
      if (!deepEqual(filters[key], defaultFilters[key])) {
        count++;
      }
    });
    return count;
  }, [filters, defaultFilters]);
  
  return {
    filters,
    setFilter,
    resetFilters,
    applyFilters,
    clearFilter,
    hasActiveFilters,
    activeFilterCount
  };
}

export default useFilterState;
