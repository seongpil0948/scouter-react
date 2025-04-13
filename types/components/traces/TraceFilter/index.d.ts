
interface ServiceInfo {
  name: string;
  count: number;
  errorCount: number;
  errorRate: number;
  avgLatency: number;
}

// Props interface
interface TraceFilterProps {
  onFilterChange?: () => void;
  className?: string;
  // 새로 추가된 실시간 모드 관련 속성
  isRealtime?: boolean;
  onToggleRealtime?: (enabled: boolean) => void;
}