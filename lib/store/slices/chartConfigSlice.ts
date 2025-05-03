import { StateCreator } from "zustand";

// 차트 설정 타입
export interface ChartConfig {
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

// 기본 설정 값
export const DEFAULT_CHART_CONFIG: ChartConfig = {
  title: "실시간 지연 시간 모니터링",
  height: 600,
  latencyThreshold: 300,
  autoUpdate: false,
  updateInterval: 30000,
  colors: {
    low: "#52c41a",
    medium: "#1890ff",
    high: "#faad14",
    critical: "#ff4d4f",
    effectScatter: "#ff4d4f",
    error: "#ff4d4f",
  },
  symbolSizes: {
    min: 8,
    max: 18,
    effectMin: 15,
    effectMax: 30,
  },
  brush: {
    enabled: true,
    type: "rect",
    mode: "multiple",
    throttleType: "debounce",
    throttleDelay: 300,
  },
};

export interface ChartConfigSlice {
  config: ChartConfig;
  updateConfig: (newConfig: Partial<ChartConfig>) => void;
}

export const createChartConfigSlice: StateCreator<
  ChartConfigSlice,
  [],
  [],
  ChartConfigSlice
> = (set, get) => ({
  config: DEFAULT_CHART_CONFIG,
  updateConfig: (newConfig) => {
    // 변경 사항이 있을 때만 업데이트
    const currentConfig = get().config;
    const hasChanges = Object.keys(newConfig).some((key) => {
      // @ts-ignore - 동적 속성 접근
      return !isEqual(newConfig[key], currentConfig[key]);
    });

    if (hasChanges) {
      set((state) => ({
        config: { ...state.config, ...newConfig },
      }));
    }
  },
});

// 객체 동등 비교 함수 (lodash의 isEqual 함수를 단순화)
function isEqual(objA: any, objB: any): boolean {
  if (objA === objB) return true;

  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return objA === objB;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!isEqual(objA[key], objB[key])) return false;
  }

  return true;
}
