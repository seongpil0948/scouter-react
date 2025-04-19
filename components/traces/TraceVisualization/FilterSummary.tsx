import React from 'react';
import { Badge } from '@heroui/badge';
import { formatDuration } from '@/lib/utils/dateFormatter';
import { isSelectionSet } from './utils';

interface FilterSummaryProps {
  filteredDataLength: number;
  dataFilters: any;
  hasFilters: boolean;
  onResetFilters: () => void;
}

const FilterSummary: React.FC<FilterSummaryProps> = ({ filteredDataLength, dataFilters, hasFilters, onResetFilters }) => {
  return (
    <div className="mt-4 text-sm text-gray-600">
      <div className="flex flex-wrap justify-between gap-2">
        <span>표시된 트레이스: {filteredDataLength}개</span>

        {dataFilters.serviceFilter !== 'all' && isSelectionSet(dataFilters.serviceFilter) && (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
            서비스: {Array.from(dataFilters.serviceFilter).join(', ')}
          </Badge>
        )}

        {dataFilters.statusFilter !== 'all' && isSelectionSet(dataFilters.statusFilter) && (
          <Badge
            className={
              dataFilters.statusFilter.has('ERROR')
                ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
            }
          >
            상태: {Array.from(dataFilters.statusFilter).join(', ')}
          </Badge>
        )}

        {(dataFilters.minDuration !== undefined || dataFilters.maxDuration !== undefined) && (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            지연 시간: {dataFilters.minDuration !== undefined ? formatDuration(dataFilters.minDuration) : '0ms'} ~
            {dataFilters.maxDuration !== undefined ? formatDuration(dataFilters.maxDuration) : '무제한'}
          </Badge>
        )}

        {/* Reset Filters Link */}
        {hasFilters && (
          <button
            className="text-xs text-blue-600 cursor-pointer dark:text-blue-400"
            onClick={onResetFilters}
            aria-label="필터 초기화"
          >
            필터 초기화
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterSummary;
