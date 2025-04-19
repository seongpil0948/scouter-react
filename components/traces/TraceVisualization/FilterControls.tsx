import React, { useCallback } from 'react';
import { Filter } from 'lucide-react';
import { Select, SelectItem } from '@heroui/select';
import { Button } from '@heroui/button';
import { isEmpty } from 'lodash-es';
import { SharedSelection } from '@heroui/system';
import { DEFAULT_FILTER } from './constant';

interface FilterControlsProps {
  services: string[];
  dataFilters: any;
  updateDataFilters: (filters: any) => void;
  onFilterChange?: (filters: any) => void;
  hasFilters: boolean;
}

// Selection에서 Set을 추출하는 타입 가드
const isSelectionSet = (selection: any): selection is Set<any> => {
  return selection instanceof Set;
};

// key를 문자열로 변환
const keyToString = (key: any): string => {
  if (typeof key === 'string' || typeof key === 'number') {
    return String(key);
  }
  return '';
};

const FilterControls: React.FC<FilterControlsProps> = ({
  services,
  dataFilters,
  updateDataFilters,
  onFilterChange,
  hasFilters
}) => {
  // 서비스 선택 키 가져오기
  const getSelectedServiceKeys = useCallback(() => {
    if (dataFilters.serviceFilter === 'all') return new Set<string>([]);
    if (isSelectionSet(dataFilters.serviceFilter)) {
      // Set을 안전하게 문자열 Set으로 변환
      return new Set(Array.from(dataFilters.serviceFilter).map(keyToString));
    }
    return new Set<string>([]);
  }, [dataFilters.serviceFilter]);

  // 상태 선택 키 가져오기
  const getSelectedStatusKeys = useCallback(() => {
    if (dataFilters.statusFilter === 'all') return new Set<string>([]);
    if (isSelectionSet(dataFilters.statusFilter)) {
      // Set을 안전하게 문자열 Set으로 변환
      return new Set(Array.from(dataFilters.statusFilter).map(keyToString));
    }
    return new Set<string>([]);
  }, [dataFilters.statusFilter]);

  // 서비스 선택 변경 처리
  const handleServiceSelectionChange = useCallback(
    (keys: SharedSelection) => {
      const serviceFilter = isEmpty(keys) ? 'all' : keys;
      const newFilters = { ...dataFilters, serviceFilter };
      updateDataFilters({ serviceFilter });

      // 상위 컴포넌트에 필터 변경 알림
      if (onFilterChange) {
        onFilterChange(newFilters);
      }
    },
    [dataFilters, updateDataFilters, onFilterChange]
  );

  // 상태 선택 변경 처리
  const handleStatusSelectionChange = useCallback(
    (keys: SharedSelection) => {
      const statusFilter = isEmpty(keys) ? 'all' : keys;
      const newFilters = { ...dataFilters, statusFilter };
      updateDataFilters({ statusFilter });

      // 상위 컴포넌트에 필터 변경 알림
      if (onFilterChange) {
        onFilterChange(newFilters);
      }
    },
    [dataFilters, updateDataFilters, onFilterChange]
  );

  // 필터 초기화
  const handleResetFilters = useCallback(() => {
    const resetFilters = DEFAULT_FILTER;
    updateDataFilters(resetFilters);

    // 상위 컴포넌트에 필터 변경 알림
    if (onFilterChange) {
      onFilterChange(resetFilters);
    }
  }, [updateDataFilters, onFilterChange]);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-1">
          <Filter size={16} />
          <span className="text-sm font-medium">필터:</span>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Service Filter */}
          <Select
            label="서비스"
            placeholder="모든 서비스"
            selectedKeys={getSelectedServiceKeys()}
            selectionMode="multiple"
            onSelectionChange={handleServiceSelectionChange}
            size="sm"
            className="w-48"
            aria-label="서비스 필터"
          >
            {services.map((service) => (
              <SelectItem key={service} textValue={service}>
                {service}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="상태"
            placeholder="모든 상태"
            selectionMode="multiple"
            selectedKeys={getSelectedStatusKeys()}
            onSelectionChange={handleStatusSelectionChange}
            size="sm"
            className="w-32"
            aria-label="상태 필터"
          >
            <SelectItem key="OK" textValue="성공">
              성공
            </SelectItem>
            <SelectItem key="ERROR" textValue="오류">
              오류
            </SelectItem>
          </Select>

          {/* Reset Filters Button */}
          {hasFilters && (
            <Button size="sm" variant="ghost" onPress={handleResetFilters} aria-label="필터 초기화">
              필터 초기화
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
