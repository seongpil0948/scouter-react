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
}


interface TraceChartProps {
  data: {
    timeSeriesData: DataPoint[];
    highLatencyData: DataPoint[];
  };
  height?: number | string;
  config: Partial<ChartConfig>;
  onDataPointClick?: (timestamp: number) => void;
  loading?: boolean;
  legendState: {
    normal: boolean;
    highLatency: boolean;
  };
}

type DataPoint = [number, number]; // [timestamp, latency]
