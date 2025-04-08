// lib/utils/traceUtils.ts

import { formatDuration } from '@/lib/utils/dateFormatter';
import { Selection } from '@react-types/shared';

/**
 * Common utility functions for trace data processing and visualization
 */

// Default configuration for trace visualization
export const DEFAULT_CHART_CONFIG: ChartConfig = {
  title: "실시간 지연 시간 모니터링",
  height: 600,
  latencyThreshold: 300,
  autoUpdate: false,
  updateInterval: 30000,
  colors: {
    low: "#52c41a",
    medium: "#1890ff",
    high: "#faad14",
    critical: "#ff4d4f",
    effectScatter: "#ff4d4f",
    error: "#ff4d4f"
  },
  symbolSizes: {
    min: 8,
    max: 18,
    effectMin: 15,
    effectMax: 30,
  },
};

/**
 * Calculate service-specific latency thresholds
 * @param traces trace data to analyze
 * @param customThresholds optional custom thresholds per service
 * @returns Map with service name keys and threshold values
 */
export function buildServiceThresholds(
  traces: TraceItem[],
  customThresholds?: Map<string, number>
): Map<string, number> {
  // If custom thresholds provided, use them
  if (customThresholds && customThresholds.size > 0) {
    return customThresholds;
  }
  
  const thresholds = new Map<string, number>();
  
  // Extract unique services and set appropriate thresholds
  traces.forEach(trace => {
    if (!trace.serviceName || thresholds.has(trace.serviceName)) return;
    
    // Apply service-specific rules
    if (trace.serviceName.includes('Airflow')) {
      thresholds.set(trace.serviceName, 600000); // 10 minutes
    } else {
      thresholds.set(trace.serviceName, 1000); // 1 second
    }
  });
  
  return thresholds;
}

/**
 * Get threshold for a specific service
 * @param serviceName service name to check
 * @param serviceThresholds map of service thresholds
 * @param defaultThreshold fallback threshold
 * @returns threshold value in milliseconds
 */
export function getServiceThreshold(
  serviceName?: string,
  serviceThresholds?: Map<string, number>,
  defaultThreshold: number = 1000
): number {
  if (!serviceName) return defaultThreshold;
  
  if (serviceThresholds?.has(serviceName)) {
    return serviceThresholds.get(serviceName) || defaultThreshold;
  }
  
  // Apply default service-specific rules
  if (serviceName.includes('Airflow')) {
    return 600000; // 10 minutes
  }
  
  return defaultThreshold;
}

/**
 * Process trace data for visualization
 * @param traces raw trace data
 * @param latencyThreshold default latency threshold
 * @param serviceThresholds service-specific thresholds
 * @returns processed data ready for chart visualization
 */
export function processTraceData(
  traces: TraceItem[],
  latencyThreshold: number = 300,
  serviceThresholds?: Map<string, number>
): {
  timeSeriesData: DataPoint[];
  highLatencyData: DataPoint[];
  metadataMap: Map<number, { serviceName: string; status?: string }>;
} {
  // 고유 ID 생성을 위한 카운터
  let uniqueCounter = 0;
  
  // 결과 배열 직접 사용 (Map 대신)
  const timeSeriesData: DataPoint[] = [];
  const highLatencyData: DataPoint[] = [];
  const metadataMap = new Map<number, { serviceName: string; status?: string }>();
  
  // 처리할 최대 데이터 수 (성능 문제 방지)
  const maxDataPoints = 10000;
  const dataToProcess = traces.slice(0, maxDataPoints);
  
  dataToProcess.forEach((trace) => {
    if (!trace) return;
    
    // 타임스탬프 파싱
    const timestamp = typeof trace.startTime === 'string' 
      ? parseInt(trace.startTime, 10) 
      : trace.startTime;
    
    if (!timestamp || isNaN(timestamp)) return;
    
    // 지연 시간 추출
    const latency = trace.duration;
    if (latency === undefined || isNaN(latency)) return;
    
    // 미세한 오프셋 추가 (동일 타임스탬프 구분용)
    // 이 방법은 차트에 영향을 거의 주지 않으면서 고유성 보장
    const adjustedTimestamp = timestamp + (uniqueCounter * 0.001);
    uniqueCounter++;
    
    // 메타데이터 저장
    metadataMap.set(adjustedTimestamp, {
      serviceName: trace.serviceName || "unknown",
      status: trace.status
    });
    
    // 데이터 포인트 생성 및 배열에 추가
    const dataPoint: DataPoint = [adjustedTimestamp, latency];
    timeSeriesData.push(dataPoint);
    
    // 서비스별 임계값 적용
    const threshold = getServiceThreshold(
      trace.serviceName,
      serviceThresholds,
      latencyThreshold
    );
    
    // 고지연 데이터 처리
    if (latency > threshold) {
      highLatencyData.push(dataPoint);
    }
  });
  
  // 배열 정렬
  timeSeriesData.sort((a, b) => a[0] - b[0]);
  highLatencyData.sort((a, b) => a[0] - b[0]);
  
  console.log(`처리된 전체 데이터: ${timeSeriesData.length}, 고지연 데이터: ${highLatencyData.length}`);
  
  return {
    timeSeriesData,
    highLatencyData,
    metadataMap
  };
}
/**
 * Find trace closest to a timestamp
 * @param traces array of trace items to search
 * @param timestamp target timestamp
 * @returns closest matching trace or null
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

/**
 * Calculate latency statistics from trace data
 * @param traces array of trace items
 * @returns statistics object with min, max, avg and percentiles
 */
export function calculateLatencyStats(traces: TraceItem[]) {
  if (!traces || traces.length === 0) {
    return { min: 0, max: 0, avg: 0, p90: 0, p95: 0, p99: 0 };
  }
  
  const durations = traces.map(t => t.duration).sort((a, b) => a - b);
  const min = durations[0];
  const max = durations[durations.length - 1];
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / durations.length;
  
  // Calculate percentiles
  const p90Index = Math.floor(durations.length * 0.9);
  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);
  
  return {
    min,
    max,
    avg,
    p90: durations[p90Index] || 0,
    p95: durations[p95Index] || 0,
    p99: durations[p99Index] || 0
  };
}

/**
 * Calculate threshold statistics per service
 * @param traces array of trace items
 * @param serviceThresholds map of service-specific thresholds
 * @returns map of service statistics
 */
export function calculateServiceStats(
  traces: TraceItem[],
  serviceThresholds: Map<string, number>
): Map<string, { total: number; exceeded: number; errorCount: number }> {
  const stats = new Map<string, { total: number; exceeded: number; errorCount: number }>();
  
  traces.forEach(trace => {
    if (!trace.serviceName) return;
    
    const threshold = getServiceThreshold(trace.serviceName, serviceThresholds);
    
    if (!stats.has(trace.serviceName)) {
      stats.set(trace.serviceName, { total: 0, exceeded: 0, errorCount: 0 });
    }
    
    const stat = stats.get(trace.serviceName)!;
    stat.total++;
    
    if (trace.duration > threshold) {
      stat.exceeded++;
    }
    
    if (trace.status === 'ERROR') {
      stat.errorCount++;
    }
  });
  
  return stats;
}

/**
 * Get color based on latency relative to threshold
 * @param latency latency value
 * @param threshold threshold value
 * @param colors color configuration
 * @param status trace status
 * @returns color string
 */
export function getLatencyColor(
  latency: number,
  threshold: number,
  colors = DEFAULT_CHART_CONFIG.colors,
  status?: string
): string {
  // Error status overrides latency colors
  if (status === 'ERROR') {
    return colors?.error || "#ff4d4f";
  }
  
  // Calculate ratio to threshold
  const ratio = latency / threshold;
  
  if (ratio < 0.5) return colors?.low || "#52c41a";
  if (ratio < 0.8) return colors?.medium || "#1890ff";
  if (ratio < 1.0) return colors?.high || "#faad14";
  
  return colors?.critical || "#ff4d4f";
}

/**
 * Filter trace data based on criteria
 * @param traces array of trace items
 * @param filters filter criteria
 * @returns filtered array of trace items
 */
export function filterTraceData(
  traces: TraceItem[],
  filters: {
    minDuration?: number;
    maxDuration?: number;
    serviceFilter?: Selection;
    statusFilter?: Selection;
    search?: string;
  }
): TraceItem[] {
  // Short-circuit if no filters
  if (!filters.minDuration && !filters.maxDuration && 
      !filters.serviceFilter && !filters.statusFilter && 
      !filters.search) {
    return traces;
  }

  return traces.filter(trace => {
    // Duration filters
    if (filters.minDuration && trace.duration < filters.minDuration) {
      return false;
    }
    if (filters.maxDuration && trace.duration > filters.maxDuration) {
      return false;
    }
    if (filters.serviceFilter !== 'all' && !filters.serviceFilter?.has(trace.serviceName)) {
      return false;
    }
    if (filters.statusFilter !== 'all' && !filters.statusFilter?.has(trace.serviceName)) {
      return false;
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      
      return (
        (trace.name && trace.name.toLowerCase().includes(searchLower)) ||
        (trace.serviceName && trace.serviceName.toLowerCase().includes(searchLower)) ||
        (trace.traceId && trace.traceId.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
}

/**
 * Format trace service and latency information for display
 * @param trace trace item
 * @param threshold service threshold
 * @returns formatted information object
 */
export function formatTraceInfo(trace: TraceItem, threshold: number) {
  const ratio = trace.duration / threshold;
  const exceedsThreshold = ratio >= 1.0;
  
  return {
    formattedDuration: formatDuration(trace.duration),
    formattedThreshold: formatDuration(threshold),
    thresholdRatio: ratio,
    thresholdPercentage: `${(ratio * 100).toFixed(1)}%`,
    exceedsThreshold,
    hasError: trace.status === 'ERROR'
  };
}

export default {
  DEFAULT_CHART_CONFIG,
  buildServiceThresholds,
  getServiceThreshold,
  processTraceData,
  findTraceByTimestamp,
  calculateLatencyStats,
  calculateServiceStats,
  getLatencyColor,
  filterTraceData,
  formatTraceInfo
};