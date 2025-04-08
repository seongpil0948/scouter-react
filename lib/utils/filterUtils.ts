// lib/utils/filterUtils.ts
import { SelectFilter } from "@/lib/store/chartStore";

/**
 * 차트 필터 상태를 API 요청 URL에 사용할 수 있는 쿼리 파라미터로 변환
 * @param baseUrl - 기본 API URL
 * @param filters - 필터 객체 (dataFilters)
 * @param timeRange - 시간 범위 객체
 * @returns 완성된 API URL 문자열
 */
export function buildApiUrlWithFilters(
  baseUrl: string,
  filters: {
    minDuration?: number;
    maxDuration?: number;
    serviceFilter: SelectFilter;
    statusFilter: SelectFilter;
  },
  timeRange: { startTime: number; endTime: number },
  additionalParams: Record<string, string | number | boolean> = {}
): string {
  // 쿼리 파라미터 객체 생성
  const params = new URLSearchParams();

  // 시간 범위 추가
  params.append("startTime", timeRange.startTime.toString());
  params.append("endTime", timeRange.endTime.toString());

  // 서비스 필터 추가 (다중 선택 지원)
  if (filters.serviceFilter !== "all" && filters.serviceFilter instanceof Set) {
    filters.serviceFilter.forEach((service) => {
      params.append("serviceName", service.toString());
    });
  }

  // 상태 필터 추가 (다중 선택 지원)
  if (filters.statusFilter !== "all" && filters.statusFilter instanceof Set) {
    filters.statusFilter.forEach((status) => {
      params.append("status", status.toString());
    });
  }

  // 지연 시간 필터 추가
  if (filters.minDuration !== undefined) {
    params.append("minDuration", filters.minDuration.toString());
  }

  if (filters.maxDuration !== undefined) {
    params.append("maxDuration", filters.maxDuration.toString());
  }

  // 추가 파라미터 처리
  Object.entries(additionalParams).forEach(([key, value]) => {
    params.append(key, value.toString());
  });

  // URL 구성
  return `${baseUrl}?${params.toString()}`;
}