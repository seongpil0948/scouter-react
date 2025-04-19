import React from 'react';
import { Badge } from '@heroui/badge';
import { formatDuration } from '@/lib/utils/dateFormatter';

interface ThresholdDisplayProps {
  serviceThresholds: Map<string, number>;
  serviceStats: Map<string, { total: number; exceeded: number; errorCount: number }>;
}

const ThresholdDisplay: React.FC<ThresholdDisplayProps> = ({ serviceThresholds, serviceStats }) => {
  if (serviceThresholds.size === 0) return null;

  return (
    <div className="mb-4 text-xs text-gray-500">
      <div className="flex items-center mb-1">
        <span className="font-medium">서비스별 임계값:</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {Array.from(serviceThresholds.entries()).map(([service, threshold]) => {
          const stats = serviceStats.get(service);
          const tooltip = stats ? `총 ${stats.total}개 중 ${stats.exceeded}개 초과` : '데이터 없음';

          return (
            <Badge key={service} className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" title={tooltip}>
              {service}: {formatDuration(threshold)}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default ThresholdDisplay;
