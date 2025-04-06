interface ChartConfig {
  title?: string;
  height?: string | number;
  maxDataPoints?: number;
  latencyThreshold?: number;
  autoUpdate?: boolean;
  updateInterval?: number;
  colors?: {
    low?: string;
    medium?: string;
    high?: string;
    critical?: string;
    effectScatter?: string;
    error?: string; // 에러 상태 색상 추가
  };
  symbolSizes?: {
    min?: number;
    max?: number;
    effectMin?: number;
    effectMax?: number;
  };
}

interface TraceVisualizationProps {
  traceData: TraceItem[];
  onDataPointClick: (trace: TraceItem) => void;
  config?: Partial<ChartConfig>;
  onRefresh?: () => Promise<any>;
  title?: string;
  showFilters?: boolean;
  serviceThresholds?: Map<string, number>; // 서비스별 임계값 추가
}

interface TraceChartProps {
  data: {
    timeSeriesData: DataPoint[];
    highLatencyData: DataPoint[];
    metadataMap: Map<number, { serviceName: string; status?: string }>; // 메타데이터 맵 추가
  };
  height?: number | string;
  config: Partial<ChartConfig>;
  onDataPointClick?: (timestamp: number) => void;
  loading?: boolean;
  legendState: {
    normal: boolean;
    highLatency: boolean;
  };
  serviceThresholds?: Map<string, number>; // 서비스별 임계값 추가
}

type DataPoint = [number, number]; // [timestamp, latency]