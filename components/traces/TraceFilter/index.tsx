'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@heroui/badge';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';
import { Filter, X, RefreshCw, SortAsc, SortDesc, List, GitCommit } from 'lucide-react';
import useSWR from 'swr';

import { useTraceFilterStore, LimitOption, SortField, SortDirection } from '@/lib/store/traceFilterStore';
import { useFilterStore } from '@/lib/store/telemetryStore';
import { buildServiceListApiUrl } from '@/lib/utils/filterUtils';
import { useIsSSR } from '@react-aria/ssr';
import { isEmpty } from 'lodash-es';
import { fetcher, SearchField, AttributeKeyField, DurationInput, SortButtons, ActiveFilters, RootSpansToggle } from './components';
import { useDisclosure } from '@heroui/modal';
import ModalBlushHelp from '../BrushHelp';

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
  const disclosureHelper = useDisclosure();

  // Skip rendering during SSR or when service options are not loaded
  if (isSSR || isEmpty(serviceOptions)) return null;

  return (
    <>
      <ModalBlushHelp disclosureHelper={disclosureHelper} />
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="font-medium">필터:</span>
              <SearchField searchInput={searchInput} setSearchInput={setSearchInput} />
              <AttributeKeyField
                attributeKeyInput={attributeKeyInput}
                setAttributeKeyInput={setAttributeKeyInput}
                attributeKey={attributeKey}
                setAttributeKey={setAttributeKey}
                onFilterChange={onFilterChange}
              />
              {hasActiveFilters() && (
                <Button size="sm" variant="ghost" color="danger" title="필터 초기화" onPress={handleClearFilters}>
                  <X size={16} className="mr-1" />
                  초기화
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
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
            <Button size="sm" variant="ghost" title="새로고침" onPress={handleRefresh}>
              <RefreshCw size={16} className="mr-1" />
              새로고침
            </Button>
            <Button onPress={disclosureHelper.onOpen} size="sm" variant="ghost">
              <GitCommit size={16} className="mr-1" />
              <span className="hidden md:inline">트레이스 선택 방법</span>
            </Button>
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
    </>
  );
};

export default TraceFilter;
