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
  config?: ChartConfig;
  height?: string | number;
  title?: string;
}

type DataPoint = [number, number]; // [timestamp, latency]
