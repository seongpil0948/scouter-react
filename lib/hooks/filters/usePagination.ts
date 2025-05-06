/**
 * 페이지네이션을 위한 커스텀 훅
 */
import { useState, useCallback, useMemo } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems: number;
  pageSizeOptions?: number[];
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  totalItems,
  pageSizeOptions = [10, 25, 50, 100],
}: UsePaginationOptions) {
  // 현재 페이지 상태
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  // 페이지 크기 상태
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  // 총 페이지 수 계산
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);
  
  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page: number) => {
    // 유효한 페이지 범위 내에서만 변경
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);
  
  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = useCallback((newSize: number) => {
    // 현재 위치를 유지하기 위한 페이지 계산
    const currentFirstItem = (currentPage - 1) * pageSize + 1;
    const newPage = Math.max(1, Math.ceil(currentFirstItem / newSize));
    
    setPageSize(newSize);
    setCurrentPage(newPage);
  }, [currentPage, pageSize]);
  
  // 다음 페이지로 이동
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);
  
  // 이전 페이지로 이동
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);
  
  // 첫 페이지로 이동
  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);
  
  // 마지막 페이지로 이동
  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);
  
  // 현재 페이지 아이템 범위 계산
  const itemRange = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(start + pageSize - 1, totalItems);
    return { start, end };
  }, [currentPage, pageSize, totalItems]);
  
  // 페이지네이션 리셋 (첫 페이지로)
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);
  
  // 현재 페이지의 데이터 슬라이스 계산
  const getPageData = useCallback((data: any[]) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, data.length);
    return data.slice(startIndex, endIndex);
  }, [currentPage, pageSize]);
  
  return {
    currentPage,
    pageSize,
    totalPages,
    itemRange,
    pageSizeOptions,
    handlePageChange,
    handlePageSizeChange,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    resetPagination,
    getPageData,
  };
}

export default usePagination;
