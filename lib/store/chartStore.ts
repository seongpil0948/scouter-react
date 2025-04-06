// lib/store/chartStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// Time range options
export type TimeRangeOption = 
  | '1m' // 1 minute
  | '5m' // 5 minutes
  | '10m' // 10 minutes
  | '1h' // 1 hour
  | '3h' // 3 hours
  | '6h' // 6 hours
  | '12h' // 12 hours
  | '1d'; // 1 day

// Refresh interval options in milliseconds
export type RefreshIntervalOption = 
  | 0     // Manual refresh only
  | 1000  // 1 second
  | 5000  // 5 seconds
  | 10000; // 10 seconds

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
    serviceFilter?: string;
    statusFilter?: string;
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

// Default chart configuration
export const DEFAULT_CHART_CONFIG: ChartConfig = {
  title: "실시간 지연 시간 모니터링",
  height: 600,
  maxDataPoints: 100,
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
 * Helper function to check if objects are deeply different
 */
function isDifferent(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return true;
  
  const keys1 = Object.keys(obj1 || {});
  const keys2 = Object.keys(obj2 || {});
  
  if (keys1.length !== keys2.length) return true;
  
  return keys1.some(key => {
    const val1 = obj1[key];
    const val2 = obj2[key];
    
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      return isDifferent(val1, val2);
    }
    
    return val1 !== val2;
  });
}

// Create Zustand store
export const useChartStore = create<ChartState>()(
  devtools(
    persist(
      (set, get) => ({
        // Chart config initialization
        config: DEFAULT_CHART_CONFIG,
        updateConfig: (newConfig) => {
          // Only update state if there are actual changes
          const currentConfig = get().config;
          const hasChanges = Object.keys(newConfig).some(key => {
            // @ts-ignore - dynamic property access
            return isDifferent(newConfig[key], currentConfig[key]);
          });
          
          if (hasChanges) {
            set((state) => ({ 
              config: { ...state.config, ...newConfig } 
            }));
          }
        },
        
        // Selected trace initialization
        selectedTrace: null,
        setSelectedTrace: (trace) => set({ selectedTrace: trace }),
        
        // Refresh state initialization
        isRefreshing: false,
        setRefreshing: (isRefreshing) => set({ isRefreshing }),
        
        // Legend state initialization
        legendState: {
          normal: true,
          highLatency: true,
        },
        toggleLegend: (type) => set((state) => ({
          legendState: {
            ...state.legendState,
            [type]: !state.legendState[type],
          }
        })),
        
        // Data filters initialization
        dataFilters: {},
        updateDataFilters: (filters) => {
          // Check if filters actually changed before updating state
          const currentFilters = get().dataFilters;
          const hasChanges = Object.keys(filters).some(key => {
            // @ts-ignore - dynamic property access
            return filters[key] !== currentFilters[key];
          });
          
          if (hasChanges) {
            set((state) => ({
              dataFilters: { ...state.dataFilters, ...filters }
            }));
          }
        },
        resetFilters: () => set({ dataFilters: {} }),

        // Time range selection - NEW
        timeRange: '1h', // Default to 1 hour
        setTimeRange: (range) => set({ timeRange: range }),

        // Refresh interval - NEW
        refreshInterval: 5000, // Default to 5 seconds
        setRefreshInterval: (interval) => set({ refreshInterval: interval }),

        // Auto-refresh status - NEW
        autoRefreshEnabled: false,
        toggleAutoRefresh: () => set((state) => ({ 
          autoRefreshEnabled: !state.autoRefreshEnabled 
        })),
        setAutoRefreshEnabled: (enabled) => set({ autoRefreshEnabled: enabled }),
      }),
      {
        name: "chart-store",
        partialize: (state) => ({
          // Only persist these parts of the state
          config: state.config,
          legendState: state.legendState,
          dataFilters: state.dataFilters,
          timeRange: state.timeRange,
          refreshInterval: state.refreshInterval,
          autoRefreshEnabled: state.autoRefreshEnabled,
        }),
      }
    )
  )
);

/**
 * Helper function to convert a time range option to milliseconds
 * @param range TimeRangeOption
 * @returns Time range in milliseconds
 */
export function timeRangeToMs(range: TimeRangeOption): number {
  const now = Date.now();
  
  switch (range) {
    case '1m': return 60 * 1000;
    case '5m': return 5 * 60 * 1000;
    case '10m': return 10 * 60 * 1000;
    case '1h': return 60 * 60 * 1000;
    case '3h': return 3 * 60 * 60 * 1000;
    case '6h': return 6 * 60 * 60 * 1000;
    case '12h': return 12 * 60 * 60 * 1000;
    case '1d': return 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000; // Default to 1 hour
  }
}

/**
 * Get time range for API queries based on selected time range option
 * @returns Object with startTime and endTime in milliseconds
 */
export function getTimeRangeForQuery(): { startTime: number; endTime: number } {
  const { timeRange } = useChartStore.getState();
  const endTime = Date.now();
  const startTime = endTime - timeRangeToMs(timeRange);
  
  return { startTime, endTime };
}

/**
 * Utility function for async refresh operation with UI feedback
 */
export function refreshChart(callback?: () => Promise<any>): Promise<void> {
  const { setRefreshing, isRefreshing } = useChartStore.getState();
  
  // Prevent concurrent refreshes
  if (isRefreshing) {
    return Promise.resolve();
  }
  
  setRefreshing(true);
  
  if (callback) {
    return callback()
      .catch(error => {
        console.error('Chart refresh error:', error);
      })
      .finally(() => {
        // Add delay for UI feedback
        setTimeout(() => {
          setRefreshing(false);
        }, 500);
      });
  }
  
  return new Promise(resolve => {
    setTimeout(() => {
      setRefreshing(false);
      resolve();
    }, 500);
  });
}

export default useChartStore;