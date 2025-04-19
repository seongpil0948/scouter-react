// lib/utils/filterUtils.ts
import { SelectFilter } from "@/lib/store/chartStore";

export function buildTraceApiUrl(
  baseUrl: string,
  filters: {
    selectedServices?: string[];
    selectedStatuses?: string[];
    searchQuery?: string;
    minDuration?: number;
    maxDuration?: number;
    attributeKey?: string;
  },
  timeRange: { startTime: number; endTime: number },
  limit: LimitOption = 100,
  sortField: SortField = 'startTime',
  sortDirection: SortDirection = 'desc',
  offset: number = 0,
  additionalParams: Record<string, string | number | boolean> = {}
): string {
  const params = new URLSearchParams();

  // 기본 파라미터 설정
  params.append("startTime", timeRange.startTime.toString());
  params.append("endTime", timeRange.endTime.toString());
  params.append("limit", limit.toString());
  
  if (offset > 0) {
    params.append("offset", offset.toString());
  }
  
  // 정렬 파라미터 설정
  params.append("sortField", sortField);
  params.append("sortDirection", sortDirection);

  // 중요: 다중 선택 파라미터는 같은 이름으로 여러 번 추가해야 함
  if (filters.selectedServices && filters.selectedServices.length > 0) {
    // 배열 처리를 위해 clear 후 각각 추가
    filters.selectedServices.forEach(service => {
      params.append("serviceName", service);
    });
  }
  
  if (filters.selectedStatuses && filters.selectedStatuses.length > 0) {
    filters.selectedStatuses.forEach(status => {
      params.append("status", status);
    });
  }
  
  if (filters.searchQuery && filters.searchQuery !== "") {
    params.append("query", filters.searchQuery);
  }
  
  if (filters.minDuration !== undefined) {
    params.append("minDuration", filters.minDuration.toString());
  }

  if (filters.maxDuration !== undefined) {
    params.append("maxDuration", filters.maxDuration.toString());
  }
  
  // 속성 키 필터 처리 강화
  if (filters.attributeKey && filters.attributeKey !== "") {
    params.append("attributeKey", filters.attributeKey.trim());
  }
    
  // 추가 파라미터 처리
  Object.entries(additionalParams).forEach(([key, value]) => {
    params.append(key, value.toString());
  });

  // URL 구성
  return `${baseUrl}?${params.toString()}`;
}

/**
 * 차트 필터 상태를 API 요청 URL에 사용할 수 있는 쿼리 파라미터로 변환
 * @param baseUrl - 기본 API URL
 * @param filters - 필터 객체 (dataFilters)
 * @param timeRange - 시간 범위 객체
 * @param additionalParams - 추가 파라미터 (rootSpansOnly 등)
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

  // 추가 파라미터 처리 (루트 스팬만 조회 여부 등)
  Object.entries(additionalParams).forEach(([key, value]) => {
    params.append(key, value.toString());
  });

  // URL 구성
  return `${baseUrl}?${params.toString()}`;
}

/**
 * 서비스 목록 조회 API URL 생성
 * @param timeRange - 시간 범위 객체
 * @returns 서비스 목록 API URL
 */
export function buildServiceListApiUrl(
  timeRange: { startTime: number; endTime: number }
): string {
  const params = new URLSearchParams();
  
  // 시간 범위 추가
  params.append("startTime", timeRange.startTime.toString());
  params.append("endTime", timeRange.endTime.toString());
  
  return `/api/telemetry/traces/services?${params.toString()}`;
}

export default {
  buildTraceApiUrl,
  buildApiUrlWithFilters,
  buildServiceListApiUrl
};