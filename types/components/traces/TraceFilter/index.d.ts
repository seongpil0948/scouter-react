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
}