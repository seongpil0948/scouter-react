// lib/store/chartStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface ChartState {
  // 차트 설정
  config: ChartConfig;
  updateConfig: (newConfig: Partial<ChartConfig>) => void;
  
  // 선택된 트레이스
  selectedTrace: TraceItem | null;
  setSelectedTrace: (trace: TraceItem | null) => void;
  
  // 차트 데이터 새로고침
  isRefreshing: boolean;
  setRefreshing: (isRefreshing: boolean) => void;
  
  // 범례 상태
  legendState: {
    normal: boolean;
    highLatency: boolean;
  };
  toggleLegend: (type: 'normal' | 'highLatency') => void;
  
  // 표시 데이터 필터링
  dataFilters: {
    minDuration?: number;
    maxDuration?: number;
    serviceFilter?: string;
    statusFilter?: string;
  };
  updateDataFilters: (filters: Partial<ChartState['dataFilters']>) => void;
}

// 기본 차트 설정
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
  },
  symbolSizes: {
    min: 8,
    max: 18,
    effectMin: 15,
    effectMax: 30,
  },
};

export const useChartStore = create<ChartState>()(
  devtools(
    persist(
      (set) => ({
        // 차트 설정 초기화
        config: DEFAULT_CHART_CONFIG,
        updateConfig: (newConfig) => 
          set((state) => ({ config: { ...state.config, ...newConfig } })),
        
        // 선택된 트레이스 초기화
        selectedTrace: null,
        setSelectedTrace: (trace) => set({ selectedTrace: trace }),
        
        // 새로고침 상태 초기화
        isRefreshing: false,
        setRefreshing: (isRefreshing) => set({ isRefreshing }),
        
        // 범례 상태 초기화
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
        
        // 데이터 필터 초기화
        dataFilters: {},
        updateDataFilters: (filters) => set((state) => ({
          dataFilters: { ...state.dataFilters, ...filters }
        })),
      }),
      {
        name: "chart-store",
        partialize: (state) => ({
          config: state.config,
          legendState: state.legendState,
          dataFilters: state.dataFilters,
        }),
      }
    )
  )
);

// 유틸리티 함수
export const refreshChart = async (callback?: () => Promise<any>) => {
  const { setRefreshing } = useChartStore.getState();
  
  setRefreshing(true);
  
  if (callback) {
    try {
      await callback();
    } catch (error) {
      console.error('차트 데이터 새로고침 중 오류 발생:', error);
    }
  }
  
  // 새로고침 UI 효과를 위해 약간의 지연 추가
  setTimeout(() => {
    setRefreshing(false);
  }, 500);
};