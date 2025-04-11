interface ChartConfig {
  title?: string;
  height?: string | number;
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
  brush?: {
    enabled: boolean;
    type: 'rect' | 'polygon' | 'lineX' | 'lineY';
    mode: 'single' | 'multiple';
    throttleType?: 'debounce' | 'throttle';
    throttleDelay?: number;
  };
}

interface TraceVisualizationProps {
  traceData: TraceItem[];
  config?: Partial<ChartConfig>;
  title?: string;
  showFilters?: boolean;
  serviceThresholds?: Map<string, number>;
  onFilterChange?: (filters: any) => void;
  onTraceSelect?: (traceId: string) => void;
}
interface TraceChartProps {
  data: {
    timeSeriesData: DataPoint[];
    highLatencyData: DataPoint[];
    metadataMap: Map<number, { serviceName: string; status?: string; traceItem: TraceItem }>;
  };
  height?: number | string;
  config: Partial<ChartConfig>;
  onDataPointClick?: (timestamp: number) => void;
  onBrushSelected?: (selectedData: SelectedTraceData[]) => void;
  loading?: boolean;
  legendState: {
    normal: boolean;
    highLatency: boolean;
  };
  serviceThresholds?: Map<string, number>;
}

type DataPoint = [number, number]; // [timestamp, latency]