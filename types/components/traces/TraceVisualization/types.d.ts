
// 브러시 선택 이벤트 인터페이스
interface BrushSelectedEvent {
  selected: {
    dataIndex: number[];
    seriesIndex: number[];
  }[];
  batch: {
    brushId: string;
    brushIndex: number;
    brushName: string;
    areas: {
      coordRange: [number, number][] | [number, number]; // 좌표계에서의 영역, [[x1, y1], [x2, y2]] 또는 [min, max]
      brushType: string; // 'rect', 'polygon', 'lineX', 'lineY'
    }[];
    selected: {
      dataIndex: number[];
      seriesIndex: number[];
    }[];
  }[];
}

// 선택된 데이터를 위한 인터페이스
interface SelectedTraceData {
  timestamp: number;
  latency: number;
  serviceName: string;
  status?: string;
  traceId: string;
  name: string;
  traceItem: TraceItem;
}

// 브러시 설정 인터페이스
interface BrushConfig {
  enabled: boolean;
  type: 'rect' | 'polygon' | 'lineX' | 'lineY';
  mode: 'single' | 'multiple';
  throttleType?: 'debounce' | 'throttle';
  throttleDelay?: number;
}

// ECharts BrushToolboxIconType 타입 정의
type BrushToolboxIconType = 'rect' | 'polygon' | 'lineX' | 'lineY' | 'keep' | 'clear';

// 차트 렌더러 옵션 확장
interface ExtendedChartRendererOptions {
  data: {
    timeSeriesData: DataPoint[];
    highLatencyData: DataPoint[];
    metadataMap: Map<number, { serviceName: string; status?: string; traceItem: TraceItem }>;
  };
  config?: Partial<ChartConfig> & {
    brush?: BrushConfig;
  };
  legendState: {
    normal: boolean;
    highLatency: boolean;
  };
  onDataPointClick?: (timestamp: number) => void;
  onBrushSelected?: (selectedData: SelectedTraceData[]) => void;
  serviceThresholds?: Map<string, number>;
}

// 차트 컴포넌트 속성 확장
interface ExtendedTraceChartProps {
  data: {
    timeSeriesData: DataPoint[];
    highLatencyData: DataPoint[];
    metadataMap: Map<number, { serviceName: string; status?: string; traceItem: TraceItem }>;
  };
  height?: number | string;
  config: Partial<ChartConfig> & {
    brush?: BrushConfig;
    realtimeRange?: number;
  };
  onDataPointClick?: (timestamp: number) => void;
  onBrushSelected?: (selectedData: SelectedTraceData[]) => void;
  loading?: boolean;
  legendState: {
    normal: boolean;
    highLatency: boolean;
  };
  serviceThresholds?: Map<string, number>;
}