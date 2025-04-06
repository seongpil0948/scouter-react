// lib/store/chartStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { DEFAULT_CONFIG } from '@/components/traces/TraceVisualization/constant';

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
  resetFilters: () => void;
}

// Zustand 스토어 생성
export const useChartStore = create<ChartState>()(
  devtools(
    persist(
      (set, get) => ({
        // 차트 설정 초기화
        config: DEFAULT_CONFIG,
        updateConfig: (newConfig) => {
          // 설정이 실제로 변경된 경우에만 상태 업데이트
          const currentConfig = get().config;
          const hasChanges = Object.keys(newConfig).some(key => {
            // @ts-ignore - 동적 속성 접근
            return JSON.stringify(newConfig[key]) !== JSON.stringify(currentConfig[key]);
          });
          
          if (hasChanges) {
            set((state) => ({ 
              config: { ...state.config, ...newConfig } 
            }));
          }
        },
        
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
        updateDataFilters: (filters) => {
          // 기존 필터와 비교하여 변경된 경우에만 업데이트
          const currentFilters = get().dataFilters;
          const hasChanges = Object.keys(filters).some(key => {
            // @ts-ignore - 동적 속성 접근
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
          config: state.config,
          legendState: state.legendState,
          dataFilters: state.dataFilters,
        }),
      }
    )
  )
);

// 유틸리티 함수 - 비동기 새로고침 처리
export const refreshChart = async (callback?: () => Promise<any>) => {
  const { setRefreshing } = useChartStore.getState();
  
  // 이미 새로고침 중이면 중복 실행 방지
  if (useChartStore.getState().isRefreshing) {
    return;
  }
  
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