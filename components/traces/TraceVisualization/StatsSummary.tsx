import React from 'react';
import { Badge } from '@heroui/badge';
import { Button } from '@heroui/button';
import { Clock, BarChart2, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { formatDuration } from '@/lib/utils/dateFormatter';

interface StatsSummaryProps {
  latencyStats: { avg: number; p90: number };
  highLatencyCount: number;
  successCount: number;
  errorCount: number;
  selectedTracesCount: number;
  onClearSelection: () => void;
}

const StatsSummary: React.FC<StatsSummaryProps> = ({
  latencyStats,
  highLatencyCount,
  successCount,
  errorCount,
  selectedTracesCount,
  onClearSelection,
}) => {
  return (
    <div className="mb-4 flex flex-wrap gap-4">
      <div className="flex items-center">
        <Clock size={16} className="mr-1 text-blue-500" aria-hidden="true" />
        <span className="text-sm">평균: {formatDuration(latencyStats.avg)}</span>
      </div>
      <div className="flex items-center">
        <BarChart2 size={16} className="mr-1 text-blue-500" aria-hidden="true" />
        <span className="text-sm">P90: {formatDuration(latencyStats.p90)}</span>
      </div>
      <div className="flex items-center">
        <AlertTriangle size={16} className="mr-1 text-orange-500" aria-hidden="true" />
        <span className="text-sm">고지연: {highLatencyCount}개</span>
      </div>
      <div className="flex items-center">
        <CheckCircle size={16} className="mr-1 text-green-500" aria-hidden="true" />
        <span className="text-sm">성공: {successCount}개</span>
      </div>
      <div className="flex items-center">
        <AlertTriangle size={16} className="mr-1 text-red-500" aria-hidden="true" />
        <span className="text-sm">오류: {errorCount}개</span>
      </div>

      {selectedTracesCount > 0 && (
        <div className="flex items-center ml-auto">
          <Badge color="primary" variant="flat">
            선택됨: {selectedTracesCount}개
          </Badge>
          <Button size="sm" variant="ghost" color="danger" className="ml-2" onPress={onClearSelection} aria-label="선택 해제">
            <Trash2 size={14} aria-hidden="true" />
            <span className="ml-1">선택 해제</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default StatsSummary;
