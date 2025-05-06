/**
 * 데이터 정렬을 위한 커스텀 훅
 */
import { useState, useCallback, useMemo } from "react";

export type SortDirection = "asc" | "desc";

export interface SortState<T = string> {
  column: T | null;
  direction: SortDirection;
}

export type SortConfig<T = string> = SortState<T> | null;

export type SortFunction<T, K = string> = (
  a: T,
  b: T,
  column: K,
  direction: SortDirection
) => number;

interface UseSortingOptions<T, K = string> {
  initialConfig?: SortConfig<K>;
  sortFn?: SortFunction<T, K>;
}

export function useSorting<T, K = string>({
  initialConfig = null,
  sortFn,
}: UseSortingOptions<T, K> = {}) {
  // 정렬 상태 관리
  const [sortConfig, setSortConfig] = useState<SortConfig<K>>(initialConfig);

  // 기본 정렬 함수
  const defaultSortFn: SortFunction<T, K> = (a, b, column, direction) => {
    if (!column) return 0;

    const aValue = (a as any)[column];
    const bValue = (b as any)[column];

    // null 또는 undefined 값 처리
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // 날짜 문자열 처리
    if (
      typeof aValue === "string" &&
      typeof bValue === "string" &&
      !isNaN(Date.parse(aValue)) &&
      !isNaN(Date.parse(bValue))
    ) {
      const dateA = new Date(aValue).getTime();
      const dateB = new Date(bValue).getTime();
      return direction === "asc" ? dateA - dateB : dateB - dateA;
    }

    // 숫자 처리
    if (typeof aValue === "number" && typeof bValue === "number") {
      return direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    // 문자열 처리
    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();

    if (aString < bString) return direction === "asc" ? -1 : 1;
    if (aString > bString) return direction === "asc" ? 1 : -1;

    return 0;
  };

  // 정렬 요청 함수
  const requestSort = useCallback(
    (column: K) => {
      setSortConfig((prev) => {
        if (!prev || prev.column !== column) {
          return { column, direction: "asc" };
        }

        // 같은 컬럼을 다시 클릭하면 방향 전환 (asc -> desc -> null)
        if (prev.direction === "asc") {
          return { column, direction: "desc" };
        }

        // 정렬 상태 제거
        return null;
      });
    },
    []
  );

  // 데이터 정렬 함수
  const sortData = useCallback(
    (data: T[]): T[] => {
      if (!sortConfig || !sortConfig.column) return [...data];

      const sortedData = [...data];
      const actualSortFn = sortFn || defaultSortFn;

      sortedData.sort((a, b) =>
        actualSortFn(a, b, sortConfig.column!, sortConfig.direction)
      );

      return sortedData;
    },
    [sortConfig, sortFn, defaultSortFn]
  );

  // 정렬 방향 가져오기
  const getSortDirection = useCallback(
    (column: K): SortDirection | null => {
      if (!sortConfig || sortConfig.column !== column) return null;
      return sortConfig.direction;
    },
    [sortConfig]
  );

  // 정렬 상태 리셋
  const resetSort = useCallback(() => {
    setSortConfig(null);
  }, []);

  return {
    sortConfig,
    requestSort,
    sortData,
    getSortDirection,
    resetSort,
  };
}

export default useSorting;
