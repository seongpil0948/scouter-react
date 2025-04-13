'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@heroui/badge';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';
import { Input } from '@heroui/input';
import { Switch } from '@heroui/switch';
import { Filter, Search, X, RefreshCw, SortAsc, SortDesc, List, GitCommit } from 'lucide-react';
import useSWR from 'swr';

import { formatDuration } from '@/lib/utils/dateFormatter';
import { useTraceFilterStore, LimitOption, SortField, SortDirection } from '@/lib/store/traceFilterStore';
import { useFilterStore } from '@/lib/store/telemetryStore';
import { buildServiceListApiUrl } from '@/lib/utils/filterUtils';
import { useIsSSR } from '@react-aria/ssr';
import { isEmpty } from 'lodash-es';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const SearchField = ({
  searchInput,
  setSearchInput,
  onSearch,
}: {
  searchInput: string;
  setSearchInput: (value: string) => void;
  onSearch?: () => void;
}) => (
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
);

const AttributeKeyField = ({
  attributeKeyInput,
  setAttributeKeyInput,
  attributeKey,
  setAttributeKey,
  onFilterChange,
}: {
  attributeKeyInput: string;
  setAttributeKeyInput: (value: string) => void;
  attributeKey: string;
  setAttributeKey: (value: string) => void;
  onFilterChange?: () => void;
}) => (
  <div className="min-w-[200px]">
    <Input
      label="속성 키 필터"
      placeholder="예: sql.query, http.method"
      value={attributeKeyInput}
      onChange={(e) => setAttributeKeyInput(e.target.value)}
      onBlur={() => {
        if (attributeKeyInput !== attributeKey) {
          setAttributeKey(attributeKeyInput);
          onFilterChange?.();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && attributeKeyInput !== attributeKey) {
          setAttributeKey(attributeKeyInput);
          onFilterChange?.();
        }
      }}
      size="sm"
      className="w-full"
    />
  </div>
);

const DurationInput = ({
  value,
  setValue,
  label,
  placeholder,
  currentValue,
  onChange,
}: {
  value: string;
  setValue: (value: string) => void;
  label: string;
  placeholder: string;
  currentValue?: number;
  onChange: () => void;
}) => (
  <div className="min-w-[140px]">
    <Input
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onChange}
      onKeyDown={(e) => e.key === 'Enter' && onChange()}
      size="sm"
      type="number"
      min="0"
      className="w-full"
    />
  </div>
);

const RootSpansToggle = ({ rootSpansOnly, onChange }: { rootSpansOnly: boolean; onChange: (value: boolean) => void }) => (
  <div className="min-w-[140px] flex flex-col justify-end">
    <div className="flex items-center gap-2 py-2">
      <Switch isSelected={rootSpansOnly} onValueChange={onChange} size="sm" />
      <div className="flex items-center text-sm">
        <GitCommit size={16} className="mr-1 text-gray-500" />
        <span>루트 스팬만 보기</span>
      </div>
    </div>
  </div>
);

const SortButtons = ({
  sortField,
  handleSortChange,
  renderSortIcon,
}: {
  sortField: SortField;
  handleSortChange: (field: SortField) => void;
  renderSortIcon: (field: SortField) => React.ReactNode;
}) => (
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
);

const ActiveFilters = ({
  filters,
  onRemoveFilter,
}: {
  filters: {
    searchQuery?: string;
    attributeKey?: string;
    selectedServices?: string[];
    selectedStatuses?: string[];
    minDuration?: number;
    maxDuration?: number;
    rootSpansOnly?: boolean;
    limit?: number;
  };
  onRemoveFilter: (type: string, value?: string) => void;
}) => (
  <div className="flex flex-wrap gap-2 mt-2">
    {filters.searchQuery && (
      <Badge color="primary" variant="flat" className="flex items-center gap-1">
        검색어: {filters.searchQuery}
        <X size={14} className="ml-1 cursor-pointer" onClick={() => onRemoveFilter('searchQuery')} />
      </Badge>
    )}

    {filters.attributeKey && (
      <Badge color="primary" variant="flat" className="flex items-center gap-1">
        속성 키: {filters.attributeKey}
        <X size={14} className="ml-1 cursor-pointer" onClick={() => onRemoveFilter('attributeKey')} />
      </Badge>
    )}

    {filters.selectedServices?.map((service) => (
      <Badge key={service} color="secondary" variant="flat" className="flex items-center gap-1">
        서비스: {service}
        <X size={14} className="ml-1 cursor-pointer" onClick={() => onRemoveFilter('service', service)} />
      </Badge>
    ))}

    {filters.selectedStatuses?.map((status) => (
      <Badge
        key={status}
        color={status === 'ERROR' ? 'danger' : status === 'OK' ? 'success' : 'default'}
        variant="flat"
        className="flex items-center gap-1"
      >
        상태: {status}
        <X size={14} className="ml-1 cursor-pointer" onClick={() => onRemoveFilter('status', status)} />
      </Badge>
    ))}

    {filters.minDuration !== undefined && (
      <Badge color="warning" variant="flat" className="flex items-center gap-1">
        최소 지연: {formatDuration(filters.minDuration)}
        <X size={14} className="ml-1 cursor-pointer" onClick={() => onRemoveFilter('minDuration')} />
      </Badge>
    )}

    {filters.maxDuration !== undefined && (
      <Badge color="warning" variant="flat" className="flex items-center gap-1">
        최대 지연: {formatDuration(filters.maxDuration)}
        <X size={14} className="ml-1 cursor-pointer" onClick={() => onRemoveFilter('maxDuration')} />
      </Badge>
    )}

    {filters.rootSpansOnly === false && (
      <Badge color="secondary" variant="flat" className="flex items-center gap-1">
        모든 스팬 보기
        <X size={14} className="ml-1 cursor-pointer" onClick={() => onRemoveFilter('rootSpansOnly')} />
      </Badge>
    )}

    {filters.limit !== 100 && (
      <Badge color="default" variant="flat" className="flex items-center gap-1">
        표시 개수: {filters.limit}개
        <X size={14} className="ml-1 cursor-pointer" onClick={() => onRemoveFilter('limit')} />
      </Badge>
    )}
  </div>
);

// Main component
const TraceFilter: React.FC<TraceFilterProps> = ({ onFilterChange, className = '' }) => {
  // Get filter state from store
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
    attributeKey,
    setAttributeKey,
    rootSpansOnly,
    setRootSpansOnly,
  } = useTraceFilterStore();

  // Get time range from global store
  const { timeRange } = useFilterStore();
  const isSSR = useIsSSR();

  // Local state for input fields
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [attributeKeyInput, setAttributeKeyInput] = useState(attributeKey);
  const [minDurationInput, setMinDurationInput] = useState(minDuration !== undefined ? minDuration.toString() : '');
  const [maxDurationInput, setMaxDurationInput] = useState(maxDuration !== undefined ? maxDuration.toString() : '');

  // Fetch service list
  const { data: serviceData } = useSWR<{ services: ServiceInfo[] }>(buildServiceListApiUrl(timeRange), fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // 30초 캐시
  });

  // Generate service options
  const serviceOptions = useMemo(() => {
    if (!serviceData?.services) return [];

    return serviceData.services.map((service) => ({
      id: service.name,
      label: service.name,
      count: service.count,
      errorRate: service.errorRate,
    }));
  }, [serviceData]);

  // Handle service selection change
  const handleServiceChange = useCallback(
    (services: string[]) => {
      setSelectedServices(services);
      onFilterChange?.();
    },
    [setSelectedServices, onFilterChange]
  );

  // Handle status selection change
  const handleStatusChange = useCallback(
    (statuses: ('OK' | 'ERROR' | 'UNSET')[]) => {
      setSelectedStatuses(statuses);
      onFilterChange?.();
    },
    [setSelectedStatuses, onFilterChange]
  );

  // Handle search query change (with debouncing)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput);
        onFilterChange?.();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, setSearchQuery, onFilterChange]);

  // Handle attribute key change (with debouncing)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (attributeKeyInput !== attributeKey) {
        setAttributeKey(attributeKeyInput);
        onFilterChange?.();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [attributeKeyInput, attributeKey, setAttributeKey, onFilterChange]);

  // Handle min duration change
  const handleMinDurationChange = useCallback(() => {
    const value = minDurationInput === '' ? undefined : parseInt(minDurationInput);
    if (value !== minDuration && (!value || !isNaN(value))) {
      setMinDuration(value);
      onFilterChange?.();
    }
  }, [minDurationInput, minDuration, setMinDuration, onFilterChange]);

  // Handle max duration change
  const handleMaxDurationChange = useCallback(() => {
    const value = maxDurationInput === '' ? undefined : parseInt(maxDurationInput);
    if (value !== maxDuration && (!value || !isNaN(value))) {
      setMaxDuration(value);
      onFilterChange?.();
    }
  }, [maxDurationInput, maxDuration, setMaxDuration, onFilterChange]);

  // Handle root spans only change
  const handleRootSpansOnlyChange = useCallback(
    (isChecked: boolean) => {
      setRootSpansOnly(isChecked);
      onFilterChange?.();
    },
    [setRootSpansOnly, onFilterChange]
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    resetAllFilters();
    setSearchInput('');
    setMinDurationInput('');
    setMaxDurationInput('');
    setAttributeKeyInput('');
    onFilterChange?.();
  }, [resetAllFilters, onFilterChange]);

  // Refresh data
  const handleRefresh = useCallback(() => {
    refreshData();
    onFilterChange?.();
  }, [refreshData, onFilterChange]);

  // Handle sort change
  const handleSortChange = useCallback(
    (field: SortField) => {
      // Toggle sort direction if clicking the same field
      const direction: SortDirection = field === sortField ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'desc';
      setSorting(field, direction);
      onFilterChange?.();
    },
    [sortField, sortDirection, setSorting, onFilterChange]
  );

  // Handle limit change
  const handleLimitChange = useCallback(
    (newLimit: LimitOption) => {
      setLimit(newLimit);
      onFilterChange?.();
    },
    [setLimit, onFilterChange]
  );

  // Render sort icon
  const renderSortIcon = useCallback(
    (field: SortField) => {
      if (field !== sortField) return null;
      return sortDirection === 'asc' ? <SortAsc size={16} className="ml-1" /> : <SortDesc size={16} className="ml-1" />;
    },
    [sortField, sortDirection]
  );

  // Handle removing a filter
  const handleRemoveFilter = useCallback(
    (type: string, value?: string) => {
      switch (type) {
        case 'searchQuery':
          setSearchInput('');
          setSearchQuery('');
          break;
        case 'attributeKey':
          setAttributeKeyInput('');
          setAttributeKey('');
          break;
        case 'service':
          if (value) {
            setSelectedServices(selectedServices.filter((s) => s !== value));
          }
          break;
        case 'status':
          if (value) {
            setSelectedStatuses(selectedStatuses.filter((s) => s !== value));
          }
          break;
        case 'minDuration':
          setMinDuration(undefined);
          setMinDurationInput('');
          break;
        case 'maxDuration':
          setMaxDuration(undefined);
          setMaxDurationInput('');
          break;
        case 'rootSpansOnly':
          setRootSpansOnly(true);
          break;
        case 'limit':
          setLimit(100);
          break;
      }
      onFilterChange?.();
    },
    [
      setSearchQuery,
      setAttributeKey,
      setSelectedServices,
      selectedServices,
      setSelectedStatuses,
      selectedStatuses,
      setMinDuration,
      setMaxDuration,
      setRootSpansOnly,
      setLimit,
      onFilterChange,
    ]
  );

  // Skip rendering during SSR or when service options are not loaded
  if (isSSR || isEmpty(serviceOptions)) return null;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
      <div className="flex flex-col gap-4">
        {/* Top filter controls */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <span className="font-medium">필터:</span>
          </div>

          {/* Search field */}
          <SearchField searchInput={searchInput} setSearchInput={setSearchInput} />

          {/* Attribute key field */}
          <AttributeKeyField
            attributeKeyInput={attributeKeyInput}
            setAttributeKeyInput={setAttributeKeyInput}
            attributeKey={attributeKey}
            setAttributeKey={setAttributeKey}
            onFilterChange={onFilterChange}
          />

          {/* Refresh button */}
          <Button size="sm" variant="ghost" title="새로고침" onPress={handleRefresh}>
            <RefreshCw size={16} className="mr-1" />
            새로고침
          </Button>

          {/* Clear filters button */}
          {hasActiveFilters() && (
            <Button size="sm" variant="ghost" color="danger" title="필터 초기화" onPress={handleClearFilters}>
              <X size={16} className="mr-1" />
              초기화
            </Button>
          )}
        </div>

        {/* Filter options */}
        <div className="flex flex-wrap gap-3">
          {/* Service filter */}
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

          {/* Status filter */}
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

          {/* Min duration filter */}
          <DurationInput
            value={minDurationInput}
            setValue={setMinDurationInput}
            label="최소 지연 시간(ms)"
            placeholder="예: 100"
            currentValue={minDuration}
            onChange={handleMinDurationChange}
          />

          {/* Max duration filter */}
          <DurationInput
            value={maxDurationInput}
            setValue={setMaxDurationInput}
            label="최대 지연 시간(ms)"
            placeholder="예: 1000"
            currentValue={maxDuration}
            onChange={handleMaxDurationChange}
          />

          {/* Root spans only toggle */}
          <RootSpansToggle rootSpansOnly={rootSpansOnly} onChange={handleRootSpansOnlyChange} />

          {/* Results limit filter */}
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

        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <List size={16} className="text-gray-500" />
            <span className="text-sm font-medium">정렬:</span>
          </div>

          <SortButtons sortField={sortField} handleSortChange={handleSortChange} renderSortIcon={renderSortIcon} />
        </div>

        {/* Active filters */}
        {hasActiveFilters() && (
          <ActiveFilters
            filters={{
              searchQuery: searchQuery || undefined,
              attributeKey: attributeKey || undefined,
              selectedServices: selectedServices.length > 0 ? selectedServices : undefined,
              selectedStatuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
              minDuration,
              maxDuration,
              rootSpansOnly: rootSpansOnly === false ? false : undefined,
              limit: limit !== 100 ? limit : undefined,
            }}
            onRemoveFilter={handleRemoveFilter}
          />
        )}
      </div>
    </div>
  );
};

export default TraceFilter;
