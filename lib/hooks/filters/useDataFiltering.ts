/**
 * 데이터 필터링을 위한 커스텀 훅
 */
import { useMemo } from "react";
import { stringSearch } from "@/lib/utils";

export type FilterFunction<T> = (item: T, filters: Record<string, any>) => boolean;

interface UseDataFilteringOptions<T> {
  data: T[];
  filters: Record<string, any>;
  filterFn?: FilterFunction<T>;
  searchFields?: (keyof T)[];
  searchTerm?: string;
}

/**
 * 데이터 필터링 훅
 * 
 * @param options 데이터 필터링 옵션
 * @returns 필터링된 데이터
 */
export function useDataFiltering<T>({
  data,
  filters,
  filterFn,
  searchFields = [],
  searchTerm = ""
}: UseDataFilteringOptions<T>) {
  // 필터링 함수 정의
  const defaultFilterFn: FilterFunction<T> = (item, filters) => {
    // 모든 필터를 통과해야 함
    return Object.entries(filters).every(([key, value]) => {
      // 필터 값이 없는 경우 통과
      if (value === null || value === undefined || value === "") return true;
      
      // 배열 값인 경우 (다중 선택)
      if (Array.isArray(value)) {
        if (value.length === 0) return true;
        
        return value.includes((item as any)[key]);
      }
      
      // 불리언 값인 경우
      if (typeof value === "boolean") {
        return (item as any)[key] === value;
      }
      
      // 숫자 범위인 경우
      if (typeof value === "object" && ("min" in value || "max" in value)) {
        const itemValue = (item as any)[key];
        if (typeof itemValue !== "number") return true;
        
        if ("min" in value && value.min !== null && itemValue < value.min) return false;
        if ("max" in value && value.max !== null && itemValue > value.max) return false;
        
        return true;
      }
      
      // 문자열 필터인 경우
      if (typeof value === "string") {
        return String((item as any)[key]).toLowerCase().includes(value.toLowerCase());
      }
      
      // 일반적인 동등 비교
      return (item as any)[key] === value;
    });
  };
  
  // 검색 함수 정의
  const searchFilter = (item: T, term: string): boolean => {
    if (!term) return true;
    
    // 검색 필드가 지정되지 않은 경우 모든 필드 검색
    if (searchFields.length === 0) {
      return Object.values(item).some(value => 
        typeof value === "string" && stringSearch(value, term)
      );
    }
    
    // 지정된 필드만 검색
    return searchFields.some(field => {
      const value = (item as any)[field];
      return typeof value === "string" && stringSearch(value, term);
    });
  };
  
  // 필터링 및 검색 적용
  return useMemo(() => {
    const customFilterFn = filterFn || defaultFilterFn;
    
    return data.filter(item => {
      const passesFilters = customFilterFn(item, filters);
      const passesSearch = searchFilter(item, searchTerm);
      
      return passesFilters && passesSearch;
    });
  }, [data, filters, filterFn, defaultFilterFn, searchFields, searchTerm]);
}

export default useDataFiltering;
