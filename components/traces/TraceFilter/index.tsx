'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@heroui/badge';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';
import { Input } from '@heroui/input';
import { Filter, Search, X, Clock, RefreshCw, SortAsc, SortDesc, List } from 'lucide-react';
import useSWR from 'swr';

import { formatDuration } from '@/lib/utils/dateFormatter';
import { useTraceFilterStore, LimitOption, SortField, SortDirection } from '@/lib/store/traceFilterStore';
import { useFilterStore } from '@/lib/store/telemetryStore';
import { buildServiceListApiUrl } from '@/lib/utils/filterUtils';

// API 호출을 위한 fetcher 함수
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TraceFilterProps {
  onFilterChange?: () => void;
  className?: string;
}

interface ServiceInfo {
  name: string;
  count: number;
  errorCount: number;
  errorRate: number;
  avgLatency: number;
}

const TraceFilter: React.FC<TraceFilterProps> = ({ onFilterChange, className = '' }) => {
  // 필터 스토어 사용
  const {
    searchQuery,
    setSearchQuery,
    limit,
    setLimit,
    selectedServices,
    setSelectedServices,
    selectedStatuses,
    setSelectedStatuses,
    minDuration,
    setMinDuration,
    maxDuration,
    setMaxDuration,
    resetAllFilters,
    refreshData,
    sortField,
    sortDirection,
    setSorting,
    hasActiveFilters,
  } = useTraceFilterStore();

  // 전역 시간 범위 스토어 사용
  const { timeRange } = useFilterStore();

  // 검색어 입력 상태 (디바운싱용)
  const [searchInput, setSearchInput] = useState(searchQuery);

  // 최소/최대 지연 시간 입력 상태 (유효성 검사용)
  const [minDurationInput, setMinDurationInput] = useState(minDuration !== undefined ? minDuration.toString() : '');
  const [maxDurationInput, setMaxDurationInput] = useState(maxDuration !== undefined ? maxDuration.toString() : '');

  // 서비스 목록 로드
  const { data: serviceData } = useSWR<{ services: ServiceInfo[] }>(buildServiceListApiUrl(timeRange), fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // 30초 캐시
  });

  // 서비스 옵션 생성
  const serviceOptions = useMemo(() => {
    if (!serviceData?.services) return [];

    return serviceData.services.map((service) => ({
      id: service.name,
      label: service.name,
      count: service.count,
      errorRate: service.errorRate,
    }));
  }, [serviceData]);

  // 서비스 선택 변경 핸들러
  const handleServiceChange = useCallback(
    (services: string[]) => {
      setSelectedServices(services);
      onFilterChange?.();
    },
    [setSelectedServices, onFilterChange]
  );

  // 상태 선택 변경 핸들러
  const handleStatusChange = useCallback(
    (statuses: ('OK' | 'ERROR' | 'UNSET')[]) => {
      setSelectedStatuses(statuses);
      onFilterChange?.();
    },
    [setSelectedStatuses, onFilterChange]
  );

  // 검색어 변경 핸들러 (디바운싱 포함)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput);
        onFilterChange?.();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, setSearchQuery, onFilterChange]);

  // 최소 지연 시간 변경 핸들러
  const handleMinDurationChange = useCallback(() => {
    const value = minDurationInput === '' ? undefined : parseInt(minDurationInput);
    if (value !== minDuration && (!value || !isNaN(value))) {
      setMinDuration(value);
      onFilterChange?.();
    }
  }, [minDurationInput, minDuration, setMinDuration, onFilterChange]);

  // 최대 지연 시간 변경 핸들러
  const handleMaxDurationChange = useCallback(() => {
    const value = maxDurationInput === '' ? undefined : parseInt(maxDurationInput);
    if (value !== maxDuration && (!value || !isNaN(value))) {
      setMaxDuration(value);
      onFilterChange?.();
    }
  }, [maxDurationInput, maxDuration, setMaxDuration, onFilterChange]);

  // 필터 초기화 핸들러
  const handleClearFilters = useCallback(() => {
    resetAllFilters();
    setSearchInput('');
    setMinDurationInput('');
    setMaxDurationInput('');
    onFilterChange?.();
  }, [resetAllFilters, onFilterChange]);

  // 새로고침 핸들러
  const handleRefresh = useCallback(() => {
    refreshData();
    onFilterChange?.();
  }, [refreshData, onFilterChange]);

  // 정렬 변경 핸들러
  const handleSortChange = useCallback(
    (field: SortField) => {
      // 같은 필드를 클릭하면 정렬 방향 전환
      const direction: SortDirection = field === sortField ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'desc'; // 새로운 필드는 항상 desc 기본값

      setSorting(field, direction);
      onFilterChange?.();
    },
    [sortField, sortDirection, setSorting, onFilterChange]
  );

  // 결과 limit 변경 핸들러
  const handleLimitChange = useCallback(
    (newLimit: LimitOption) => {
      setLimit(newLimit);
      onFilterChange?.();
    },
    [setLimit, onFilterChange]
  );

  // 정렬 아이콘 렌더링
  const renderSortIcon = useCallback(
    (field: SortField) => {
      if (field !== sortField) return null;

      return sortDirection === 'asc' ? <SortAsc size={16} className="ml-1" /> : <SortDesc size={16} className="ml-1" />;
    },
    [sortField, sortDirection]
  );

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
      <div className="flex flex-col gap-4">
        {/* 상단 필터 컨트롤 영역 */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <span className="font-medium">필터:</span>
          </div>

          {/* 검색 필드 */}
          <div className="flex-1 relative min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="이름, 서비스, 트레이스 ID 검색"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 w-full"
            />
            {searchInput && (
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                onClick={() => setSearchInput('')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* 새로고침 버튼 */}
          <Button size="sm" variant="ghost" title="새로고침" onPress={handleRefresh}>
            <RefreshCw size={16} className="mr-1" />
            새로고침
          </Button>

          {/* 필터 초기화 버튼 */}
          {hasActiveFilters() && (
            <Button size="sm" variant="ghost" color="danger" title="필터 초기화" onPress={handleClearFilters}>
              <X size={16} className="mr-1" />
              초기화
            </Button>
          )}
        </div>

        {/* 필터 옵션 영역 */}
        <div className="flex flex-wrap gap-3">
          {/* 서비스 필터 */}
          <div className="min-w-[200px]">
            <Select
              label="서비스"
              placeholder="서비스 선택"
              selectionMode="multiple"
              selectedKeys={selectedServices}
              onSelectionChange={(keys) => {
                if (typeof keys === 'string') return;
                handleServiceChange(Array.from(keys) as string[]);
              }}
              size="sm"
              className="w-full"
            >
              {serviceOptions.map((service) => (
                <SelectItem key={service.id} textValue={service.label}>
                  <div className="flex items-center justify-between w-full">
                    <span>{service.label}</span>
                    <span className="text-xs text-gray-500">
                      {service.count}건
                      {service.errorRate > 0 && <span className="ml-1 text-red-500">({service.errorRate.toFixed(1)}% 오류)</span>}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* 상태 필터 */}
          <div className="min-w-[140px]">
            <Select
              label="상태"
              placeholder="상태 선택"
              selectionMode="multiple"
              selectedKeys={selectedStatuses}
              onSelectionChange={(keys) => {
                if (typeof keys === 'string') return;
                handleStatusChange(Array.from(keys) as ('OK' | 'ERROR' | 'UNSET')[]);
              }}
              size="sm"
              className="w-full"
            >
              <SelectItem key="OK" textValue="성공">
                <Badge color="success">성공</Badge>
              </SelectItem>
              <SelectItem key="ERROR" textValue="오류">
                <Badge color="danger">오류</Badge>
              </SelectItem>
              <SelectItem key="UNSET" textValue="미설정">
                <Badge color="default">미설정</Badge>
              </SelectItem>
            </Select>
          </div>

          {/* 최소 지연 시간 필터 */}
          <div className="min-w-[140px]">
            <Input
              label="최소 지연 시간(ms)"
              placeholder="예: 100"
              value={minDurationInput}
              onChange={(e) => setMinDurationInput(e.target.value)}
              onBlur={handleMinDurationChange}
              onKeyDown={(e) => e.key === 'Enter' && handleMinDurationChange()}
              size="sm"
              type="number"
              min="0"
              className="w-full"
            />
          </div>

          {/* 최대 지연 시간 필터 */}
          <div className="min-w-[140px]">
            <Input
              label="최대 지연 시간(ms)"
              placeholder="예: 1000"
              value={maxDurationInput}
              onChange={(e) => setMaxDurationInput(e.target.value)}
              onBlur={handleMaxDurationChange}
              onKeyDown={(e) => e.key === 'Enter' && handleMaxDurationChange()}
              size="sm"
              type="number"
              min="0"
              className="w-full"
            />
          </div>

          {/* 결과 수 제한 필터 */}
          <div className="min-w-[140px]">
            <Select
              label="표시 개수"
              size="sm"
              selectedKeys={[limit.toString()]}
              onSelectionChange={(keys) => {
                if (typeof keys === 'string') return;
                const key = Array.from(keys)[0];
                handleLimitChange(parseInt(String(key)) as LimitOption);
              }}
              className="w-full"
            >
              <SelectItem key="50" textValue="50개">
                50개
              </SelectItem>
              <SelectItem key="100" textValue="100개">
                100개
              </SelectItem>
              <SelectItem key="200" textValue="200개">
                200개
              </SelectItem>
              <SelectItem key="500" textValue="500개">
                500개
              </SelectItem>
              <SelectItem key="1000" textValue="1000개">
                1000개
              </SelectItem>
            </Select>
          </div>
        </div>

        {/* 정렬 영역 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <List size={16} className="text-gray-500" />
            <span className="text-sm font-medium">정렬:</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              size="sm"
              variant={sortField === 'startTime' ? 'solid' : 'ghost'}
              color={sortField === 'startTime' ? 'primary' : 'default'}
              onPress={() => handleSortChange('startTime')}
            >
              시간
              {renderSortIcon('startTime')}
            </Button>

            <Button
              size="sm"
              variant={sortField === 'duration' ? 'solid' : 'ghost'}
              color={sortField === 'duration' ? 'primary' : 'default'}
              onPress={() => handleSortChange('duration')}
            >
              지연 시간
              {renderSortIcon('duration')}
            </Button>

            <Button
              size="sm"
              variant={sortField === 'serviceName' ? 'solid' : 'ghost'}
              color={sortField === 'serviceName' ? 'primary' : 'default'}
              onPress={() => handleSortChange('serviceName')}
            >
              서비스
              {renderSortIcon('serviceName')}
            </Button>

            <Button
              size="sm"
              variant={sortField === 'status' ? 'solid' : 'ghost'}
              color={sortField === 'status' ? 'primary' : 'default'}
              onPress={() => handleSortChange('status')}
            >
              상태
              {renderSortIcon('status')}
            </Button>

            <Button
              size="sm"
              variant={sortField === 'name' ? 'solid' : 'ghost'}
              color={sortField === 'name' ? 'primary' : 'default'}
              onPress={() => handleSortChange('name')}
            >
              이름
              {renderSortIcon('name')}
            </Button>
          </div>
        </div>

        {/* 활성 필터 표시 영역 */}
        {hasActiveFilters() && (
          <div className="flex flex-wrap gap-2 mt-2">
            {searchQuery && (
              <Badge color="primary" variant="flat" className="flex items-center gap-1">
                검색어: {searchQuery}
                <X
                  size={14}
                  className="ml-1 cursor-pointer"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                    onFilterChange?.();
                  }}
                />
              </Badge>
            )}

            {selectedServices.length > 0 &&
              selectedServices.map((service) => (
                <Badge key={service} color="secondary" variant="flat" className="flex items-center gap-1">
                  서비스: {service}
                  <X
                    size={14}
                    className="ml-1 cursor-pointer"
                    onClick={() => {
                      setSelectedServices(selectedServices.filter((s) => s !== service));
                      onFilterChange?.();
                    }}
                  />
                </Badge>
              ))}

            {selectedStatuses.length > 0 &&
              selectedStatuses.map((status) => (
                <Badge
                  key={status}
                  color={status === 'ERROR' ? 'danger' : status === 'OK' ? 'success' : 'default'}
                  variant="flat"
                  className="flex items-center gap-1"
                >
                  상태: {status}
                  <X
                    size={14}
                    className="ml-1 cursor-pointer"
                    onClick={() => {
                      setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
                      onFilterChange?.();
                    }}
                  />
                </Badge>
              ))}

            {minDuration !== undefined && (
              <Badge color="warning" variant="flat" className="flex items-center gap-1">
                최소 지연: {formatDuration(minDuration)}
                <X
                  size={14}
                  className="ml-1 cursor-pointer"
                  onClick={() => {
                    setMinDuration(undefined);
                    setMinDurationInput('');
                    onFilterChange?.();
                  }}
                />
              </Badge>
            )}

            {maxDuration !== undefined && (
              <Badge color="warning" variant="flat" className="flex items-center gap-1">
                최대 지연: {formatDuration(maxDuration)}
                <X
                  size={14}
                  className="ml-1 cursor-pointer"
                  onClick={() => {
                    setMaxDuration(undefined);
                    setMaxDurationInput('');
                    onFilterChange?.();
                  }}
                />
              </Badge>
            )}

            {limit !== 100 && (
              <Badge color="default" variant="flat" className="flex items-center gap-1">
                표시 개수: {limit}개
                <X
                  size={14}
                  className="ml-1 cursor-pointer"
                  onClick={() => {
                    setLimit(100);
                    onFilterChange?.();
                  }}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TraceFilter;
