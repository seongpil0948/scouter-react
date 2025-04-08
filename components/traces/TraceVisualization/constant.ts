export const DEFAULT_CONFIG: ChartConfig = {
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
  },
  symbolSizes: {
    min: 8,
    max: 18,
    effectMin: 15,
    effectMax: 30,
  },
};

export const DEFAULT_FILTER = Object.freeze<ChartState['dataFilters']>({
      minDuration: undefined,
      maxDuration: undefined,
      serviceFilter: 'all',
      statusFilter: 'all',
    })