// Time range options
type TimeRangeOption =
  | "1m" // 1 minute
  | "5m" // 5 minutes
  | "10m" // 10 minutes
  | "1h" // 1 hour
  | "3h" // 3 hours
  | "6h" // 6 hours
  | "12h" // 12 hours
  | "1d"; // 1 day

type Key = string | number;
type SelectionFilter = "all" | Set<Key>;

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
    error?: string;
  };
  symbolSizes?: {
    min?: number;
    max?: number;
    effectMin?: number;
    effectMax?: number;
  };
  brush?: {
    enabled: boolean;
    type: "rect" | "polygon" | "lineX" | "lineY";
    mode: "single" | "multiple";
    throttleType?: "debounce" | "throttle";
    throttleDelay?: number;
  };
  realtimeRange?: number;
}

interface ChartConfigSlice {
  config: ChartConfig;
  updateConfig: (newConfig: Partial<ChartConfig>) => void;
}

interface ChartStoreState extends ChartConfigSlice {
  // 선택된 트레이스
  selectedTrace: TraceItem | null;
  setSelectedTrace: (trace: TraceItem | null) => void;

  // 범례 상태
  legendState: {
    normal: boolean;
    highLatency: boolean;
  };
  toggleLegend: (type: "normal" | "highLatency") => void;

  // 데이터 필터
  dataFilters: {
    minDuration?: number;
    maxDuration?: number;
    serviceFilter: SelectFilter;
    statusFilter: SelectFilter;
  };
  updateDataFilters: (filters: Partial<ChartStoreState["dataFilters"]>) => void;
  resetFilters: () => void;
}
