// lib/store/chartStore.ts
import { DEFAULT_FILTER } from '@/components/traces/TraceVisualization/constant';
import { DEFAULT_CHART_CONFIG } from '@/components/traces/TraceVisualization/utils';
import { isEqual } from 'lodash-es';
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Selection } from '@react-types/shared';

// SelectFilter를 명확하게 정의
export type SelectFilter = 'all' | Selection;

// ChartState 인터페이스 수정 - 리프레시 관련 로직 제거
interface ChartState {
  // Chart configuration
  config: ChartConfig;
  updateConfig: (newConfig: Partial<ChartConfig>) => void;
  
  // Selected trace
  selectedTrace: TraceItem | null;
  setSelectedTrace: (trace: TraceItem | null) => void;
  
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
}

// Create Zustand store - 리프레시 로직 제거됨
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
      }),
      {
        name: "chart-store",
        partialize: (state) => ({
          // Only persist these parts of the state
          config: state.config,
          legendState: state.legendState,
        }),
      }
    )
  )
);

/**
 * Time range value to milliseconds mapping for SWR
 */
export const TIME_RANGE_MS = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '10m': 10 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
};

export default useChartStore;