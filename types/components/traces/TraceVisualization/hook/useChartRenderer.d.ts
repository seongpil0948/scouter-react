// Define interfaces for better type safety
interface ChartData {
  timeSeriesData: [number, number][];
  highLatencyData: [number, number][];
  metadataMap: Map<number, any>; // Consider defining a more specific type for metadata
}

interface LegendState {
  normal: boolean;
  highLatency: boolean;
  [key: string]: boolean; // Allow other potential legend items
}

interface ChartConfig {
  height?: number;
  autoUpdate?: boolean;
  // Add other config properties if needed
}

interface ServiceThresholds {
  [serviceName: string]: number;
}

// Define types for brush event parameters
interface SelectionItem {
  seriesIndex: number;
  dataIndex: number[];
}

interface BatchItem {
  selected: SelectionItem[];
}

interface BrushParams {
  batch: BatchItem[];
}

// Define types for refs storing previous state
interface RangeBounds {
  min: number;
  max: number;
}
interface SeriesData {
  timeSeriesData: [number, number][];
  highLatencyData: [number, number][];
}

interface UseChartRendererProps {
  data: ChartData;
  config?: ChartConfig;
  legendState: LegendState;
  onDataPointClick?: (timestamp: number) => void;
  onBrushSelected?: (selectedData: SelectedTraceData[]) => void;
  serviceThresholds: ServiceThresholds;
}
