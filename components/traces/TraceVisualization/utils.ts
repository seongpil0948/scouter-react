
// utils/traceDataProcessor.ts

/**
 * 트레이스 데이터를 차트 데이터로 변환하는 유틸리티
 */
export function processTraceData(
  traces: TraceItem[],
  latencyThreshold: number = 300,
  maxDataPoints: number = 100,
  serviceThresholds?: Map<string, number>
): { 
  timeSeriesData: DataPoint[]; 
  highLatencyData: DataPoint[];
  metadataMap: Map<number, { serviceName: string; status?: string }>;
} {
  // 중복 방지를 위한 맵 사용
  const timeSeriesMap = new Map<number, DataPoint>();
  const highLatencyMap = new Map<number, DataPoint>();
  // 메타데이터 맵 추가
  const metadataMap = new Map<number, { serviceName: string; status?: string }>();
  
  // 기본 서비스별 임계값 함수
  const getServiceThreshold = (serviceName: string): number => {
    // 서비스별 임계값 맵이 제공된 경우 사용
    if (serviceThresholds?.has(serviceName)) {
      return serviceThresholds.get(serviceName) || latencyThreshold;
    }
    
    // Airflow 서비스는 10분(600,000ms)
    if (serviceName.includes('Airflow')) {
      return 600000; // 10분 (밀리초)
    }
    
    // 그 외 서비스는 1초(1,000ms)
    return 1000;
  };
  
  // 데이터 처리
  traces.forEach((trace) => {
    // 유효성 검사
    if (!trace) return;
    
    // 타임스탬프 처리
    const timestamp = typeof trace.startTime === 'string' 
      ? parseInt(trace.startTime, 10) 
      : trace.startTime;
    
    if (!timestamp || isNaN(timestamp)) return;
    
    // 지연 시간 처리
    const latency = trace.duration;
    
    if (latency === undefined || isNaN(latency)) return;
    
    // 메타데이터 저장
    metadataMap.set(timestamp, {
      serviceName: trace.serviceName || "unknown",
      status: trace.status
    });
    
    // 데이터 포인트 생성
    const dataPoint: DataPoint = [timestamp, latency];
    
    // 맵에 추가
    timeSeriesMap.set(timestamp, dataPoint);
    
    // 서비스별 임계값 적용
    const serviceThreshold = getServiceThreshold(trace.serviceName || "unknown");
    
    // 고지연 데이터 분류 (서비스별 임계값 적용)
    if (latency > serviceThreshold) {
      highLatencyMap.set(timestamp, dataPoint);
    }
  });
  
  // 맵을 배열로 변환, 정렬 및 제한
  const timeSeriesData = Array.from(timeSeriesMap.values())
    .sort((a, b) => a[0] - b[0])
    .slice(-maxDataPoints);
  
  const highLatencyData = Array.from(highLatencyMap.values())
    .sort((a, b) => a[0] - b[0])
    .slice(-maxDataPoints);
  
  return {
    timeSeriesData,
    highLatencyData,
    metadataMap
  };
}
/**
 * 타임스탬프로 트레이스 찾기
 */
export function findTraceByTimestamp(
  traces: TraceItem[],
  timestamp: number
): TraceItem | null {
  if (!traces || !traces.length) return null;
  
  return traces.reduce((closest, trace) => {
    const currentDiff = Math.abs(trace.startTime - timestamp);
    const closestDiff = closest 
      ? Math.abs(closest.startTime - timestamp)
      : Infinity;
    
    return currentDiff < closestDiff ? trace : closest;
  }, null as TraceItem | null);
}

export default {
  processTraceData,
  findTraceByTimestamp
};

/**
 * 차트에 사용되는 유틸리티 함수와 상수 모음
 */

// 기본 차트 색상 설정
export const DEFAULT_COLORS = {
  low: "#52c41a",      // 낮은 지연시간
  medium: "#1890ff",   // 보통 지연시간
  high: "#faad14",     // 높은 지연시간
  critical: "#ff4d4f", // 임계치 초과 지연시간
  effectScatter: "#ff4d4f", // 고지연 요청 색상
};

// 기본 심볼 크기 설정
export const DEFAULT_SYMBOL_SIZES = {
  min: 8,
  max: 18,
  effectMin: 15,
  effectMax: 30,
};

/**
 * 지연 시간에 따른 색상 결정
 */
export function getLatencyColor(latency: number, colors = DEFAULT_COLORS) {
  if (latency < 100) return colors.low;
  if (latency < 200) return colors.medium;
  if (latency < 300) return colors.high;
  return colors.critical;
}

/**
 * 지연 시간에 따른 심볼 크기 계산
 */
export function calculateSymbolSize(
  latency: number, 
  isHighLatency: boolean = false,
  symbolSizes = DEFAULT_SYMBOL_SIZES
) {
  if (isHighLatency) {
    const minSize = symbolSizes.effectMin;
    const maxSize = symbolSizes.effectMax;
    return minSize + Math.min(latency / 50, maxSize - minSize);
  } else {
    const minSize = symbolSizes.min;
    const maxSize = symbolSizes.max;
    return minSize + Math.min(latency / 50, maxSize - minSize);
  }
}

/**
 * 다크 모드 테마에 따른 차트 테마 옵션 생성
 */
export function getChartThemeOptions(isDarkMode: boolean) {
  if (isDarkMode) {
    return {
      backgroundColor: "#141414",
      textStyle: { color: "#ffffff" },
      axisLine: { lineStyle: { color: "#333" } },
      splitLine: { lineStyle: { color: "#333" } },
    };
  }
  return {};
}

/**
 * 시간 데이터 포인트 중복 제거 및 정렬 처리
 */
export function processTimeSeries(data: any[], maxPoints: number = 100) {
  // 중복 제거를 위한 Map 사용 (timestamp를 키로)
  const uniqueDataMap = new Map();
  
  // 기존 데이터를 Map에 추가
  data.forEach(point => {
    if (Array.isArray(point) && point.length >= 2) {
      const timestamp = point[0];
      const value = point[1];
      
      // 유효한 값인지 확인
      if (!isNaN(timestamp) && !isNaN(value)) {
        uniqueDataMap.set(timestamp, point);
      }
    }
  });
  
  // Map을 배열로 변환하고 timestamp로 정렬
  const sortedData = Array.from(uniqueDataMap.values())
    .sort((a, b) => a[0] - b[0]);
  
  // 최대 포인트 수를 초과하면 최신 데이터만 유지
  return sortedData.slice(-maxPoints);
}

/**
 * 글로벌 차트 설정 적용 (ECharts 인스턴스에 적용하기 전)
 */
export function applyChartGlobalConfig(config: ChartConfig = {}) {
  // 여기서 ECharts의 글로벌 설정을 수정할 수 있음
  // 예: echarts.registerTheme(...) 등
}