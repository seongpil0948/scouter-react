// lib/store/chartStore.ts
import { DEFAULT_CHART_CONFIG } from '@/components/traces/TraceVisualization/utils';
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

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
}

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
      }),
      {
        name: "chart-store",
        partialize: (state) => ({
          // Only persist these parts of the state
          config: state.config,
          legendState: state.legendState,
          dataFilters: state.dataFilters,
        }),
      }
    )
  )
);

/**
 * Utility function for async refresh operation with UI feedback
 */
export const refreshChart = async (callback?: () => Promise<any>) => {
  const { setRefreshing, isRefreshing } = useChartStore.getState();
  
  // Prevent concurrent refreshes
  if (isRefreshing) {
    return;
  }
  
  setRefreshing(true);
  
  if (callback) {
    try {
      await callback();
    } catch (error) {
      console.error('Chart refresh error:', error);
    }
  }
  
  // Add delay for UI feedback
  setTimeout(() => {
    setRefreshing(false);
  }, 500);
};

export default useChartStore;