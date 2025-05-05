// lib/utils/filterUtils.ts

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
  sortField: SortField = "startTime",
  sortDirection: SortDirection = "desc",
  offset: number = 0,
  additionalParams: Record<string, string | number | boolean> = {}
): string {
  const params = new URLSearchParams();

  // 시간 범위 유효성 검증 추가
  const validStartTime =
    timeRange.startTime > 0 ? timeRange.startTime : Date.now() - 3600000;
  const validEndTime = timeRange.endTime > 0 ? timeRange.endTime : Date.now();

  // 유효한 시간 값만 URL에 추가
  params.append("startTime", validStartTime.toString());
  params.append("endTime", validEndTime.toString());
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
    filters.selectedServices.forEach((service) => {
      params.append("serviceName", service);
    });
  }

  if (filters.selectedStatuses && filters.selectedStatuses.length > 0) {
    filters.selectedStatuses.forEach((status) => {
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

  if (filters.attributeKey && filters.attributeKey.trim() !== "") {
    params.append("attributeKey", filters.attributeKey.trim());
  }

  // 추가 파라미터 처리
  Object.entries(additionalParams).forEach(([key, value]) => {
    params.append(key, value.toString());
  });

  const url = `${baseUrl}?${params.toString()}`;
  console.debug(`생성된 API URL: ${url}`);
  return url;
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
export function buildServiceListApiUrl(timeRange: {
  startTime: number;
  endTime: number;
}): string {
  const params = new URLSearchParams();

  // 시간 범위 추가
  params.append("startTime", timeRange.startTime.toString());
  params.append("endTime", timeRange.endTime.toString());

  return `${process.env.NEXT_PUBLIC_API_BASE_PATH}/telemetry/metrics/services?${params.toString()}`;
}

// lib/utils/filterUtils.ts (추가 부분)
export function buildLogApiUrl(
  baseUrl: string,
  filters: {
    startTime: number;
    endTime: number;
    serviceName?: string | null;
    severity?: string | null;
    hasTrace?: boolean;
    query?: string;
    limit?: number;
  },
  offset: number = 0,
  additionalParams: Record<string, string | number | boolean> = {}
): string {
  const params = new URLSearchParams();

  // 시간 범위 추가
  params.append("startTime", filters.startTime.toString());
  params.append("endTime", filters.endTime.toString());

  // 필터 추가
  if (filters.serviceName) {
    params.append("serviceName", filters.serviceName);
  }

  if (filters.severity) {
    params.append("severity", filters.severity);
  }

  if (filters.hasTrace !== undefined) {
    params.append("hasTrace", filters.hasTrace.toString());
  }

  if (filters.query) {
    params.append("query", filters.query);
  }

  // 페이지네이션
  params.append("limit", filters.limit?.toString() || "100");

  if (offset > 0) {
    params.append("offset", offset.toString());
  }

  // 추가 파라미터
  Object.entries(additionalParams).forEach(([key, value]) => {
    params.append(key, value.toString());
  });

  return `${baseUrl}?${params.toString()}`;
}

export default {
  buildTraceApiUrl,
  buildApiUrlWithFilters,
  buildServiceListApiUrl,
};
