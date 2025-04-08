// Time range options
type TimeRangeOption = 
  | '1m' // 1 minute
  | '5m' // 5 minutes
  | '10m' // 10 minutes
  | '1h' // 1 hour
  | '3h' // 3 hours
  | '6h' // 6 hours
  | '12h' // 12 hours
  | '1d'; // 1 day

// Refresh interval options in milliseconds
type RefreshIntervalOption = 
  | 0     // Manual refresh only
  | 1000  // 1 second
  | 5000  // 5 seconds
  | 10000; // 10 seconds

type Key = string | number;
type SelectionFilter = 'all' | Set<Key>;

interface ChartState {
  // Chart configuration
  config: ChartConfig;
  updateConfig: (newConfig: Partial<ChartConfig>) => void;
  
  // Selected trace
  selectedTrace: TraceItem | null;
  setSelectedTrace: (trace: TraceItem | null) => void;
  
  // Chart refresh state
  isRefreshing: boolean;
  setRefreshing: (isRefreshing: boolean) => void;
  
  // Legend state for chart series
  legendState: {
    normal: boolean;
    highLatency: boolean;
  };
  toggleLegend: (type: 'normal' | 'highLatency') => void;
  
  // Data filters
  dataFilters: {
    minDuration?: number;
    maxDuration?: number;
    serviceFilter: SelectionFilter;
    statusFilter:  SelectionFilter;
  };
  updateDataFilters: (filters: Partial<ChartState['dataFilters']>) => void;
  resetFilters: () => void;

  // Time range configuration - NEW
  timeRange: TimeRangeOption;
  setTimeRange: (range: TimeRangeOption) => void;

  // Refresh interval configuration - NEW
  refreshInterval: RefreshIntervalOption;
  setRefreshInterval: (interval: RefreshIntervalOption) => void;
  
  // Auto-refresh enabled status - NEW
  autoRefreshEnabled: boolean;
  toggleAutoRefresh: () => void;
  setAutoRefreshEnabled: (enabled: boolean) => void;
}

