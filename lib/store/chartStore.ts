// lib/store/chartStore.ts
import { DEFAULT_FILTER } from '@/components/traces/TraceVisualization/constant';
import { DEFAULT_CHART_CONFIG } from '@/components/traces/TraceVisualization/utils';
import { isEqual } from 'lodash-es';
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Selection } from '@react-types/shared';

// SelectFilter를 명확하게 정의
export type SelectFilter = 'all' | Selection;

// ChartState 인터페이스 수정
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
    serviceFilter: SelectFilter;
    statusFilter: SelectFilter;
  };
  updateDataFilters: (filters: Partial<ChartState['dataFilters']>) => void;
  resetFilters: () => void;

  // Time range configuration
  timeRange: TimeRangeOption;
  setTimeRange: (range: TimeRangeOption) => void;

  // Refresh interval configuration
  refreshInterval: RefreshIntervalOption;
  setRefreshInterval: (interval: RefreshIntervalOption) => void;
  
  // Auto-refresh enabled status
  autoRefreshEnabled: boolean;
  toggleAutoRefresh: () => void;
  setAutoRefreshEnabled: (enabled: boolean) => void;
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
            return !isEqual(newConfig[key], currentConfig[key]);
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
        dataFilters: DEFAULT_FILTER,
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
        resetFilters: () => set({ dataFilters: DEFAULT_FILTER }),

        // Time range selection
        timeRange: '1h', // Default to 1 hour
        setTimeRange: (range) => set({ timeRange: range }),

        // Refresh interval
        refreshInterval: 5000, // Default to 5 seconds
        setRefreshInterval: (interval) => set({ refreshInterval: interval }),

        // Auto-refresh status
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
          // dataFilters는 선택적으로 저장 (문제가 있는 경우 제외 가능)
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