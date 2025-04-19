"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import {
  Filter,
  X,
  RefreshCw,
  SortAsc,
  SortDesc,
  GitCommit,
} from "lucide-react";
import { Tooltip } from "@heroui/tooltip";

import { useTraceFilterStore } from "@/lib/store/traceFilterStore";
import { useFilterStore } from "@/lib/store/telemetryStore";
import { buildServiceListApiUrl } from "@/lib/utils/filterUtils";
import { useIsSSR } from "@react-aria/ssr";
import { isEmpty } from "lodash-es";
import {
  SearchField,
  AttributeKeyField,
  DurationInput,
  SortButtons,
  ActiveFilters,
  RootSpansToggle,
} from "./components";
import RealtimeSettings from "./RealtimeSettings";
import { useDisclosure } from "@heroui/modal";
import ModalBlushHelp from "../BrushHelp";
import useSWR from "swr";
import {
  RefreshIntervalOption,
  RealtimeRangeOption,
} from "@/lib/hooks/useTraceData";
import { Accordion, AccordionItem } from "@heroui/accordion";

// API 응답 fetcher 함수 (여기서만 사용됨)
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TraceFilterProps {
  onFilterChange?: () => void;
  className?: string;
  isRealtime?: boolean;
  onToggleRealtime?: (enabled: boolean) => void;
  refreshInterval?: RefreshIntervalOption;
  onRefreshIntervalChange?: (interval: RefreshIntervalOption) => void;
  realtimeRange?: RealtimeRangeOption;
  onRealtimeRangeChange?: (range: RealtimeRangeOption) => void;
  onRefresh?: () => void;
}

const TraceFilter: React.FC<TraceFilterProps> = ({
  onFilterChange,
  className = "",
  isRealtime = false,
  onToggleRealtime,
  refreshInterval = 5,
  onRefreshIntervalChange,
  realtimeRange = 5,
  onRealtimeRangeChange,
  onRefresh,
}) => {
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
  const [minDurationInput, setMinDurationInput] = useState(
    minDuration !== undefined ? minDuration.toString() : ""
  );
  const [maxDurationInput, setMaxDurationInput] = useState(
    maxDuration !== undefined ? maxDuration.toString() : ""
  );

  // Fetch service list
  const { data: serviceData } = useSWR<{ services: ServiceInfo[] }>(
    buildServiceListApiUrl(timeRange),
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30초 캐시
    }
  );

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
    (statuses: ("OK" | "ERROR" | "UNSET")[]) => {
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
    const value =
      minDurationInput === "" ? undefined : parseInt(minDurationInput);
    if (value !== minDuration && (!value || !isNaN(value))) {
      setMinDuration(value);
      onFilterChange?.();
    }
  }, [minDurationInput, minDuration, setMinDuration, onFilterChange]);

  // Handle max duration change
  const handleMaxDurationChange = useCallback(() => {
    const value =
      maxDurationInput === "" ? undefined : parseInt(maxDurationInput);
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
    setSearchInput("");
    setMinDurationInput("");
    setMaxDurationInput("");
    setAttributeKeyInput("");
    onFilterChange?.();
  }, [resetAllFilters, onFilterChange]);

  // Refresh data - 디바운스 추가
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return; // 연속 클릭 방지

    setIsRefreshing(true);
    refreshData();
    onRefresh?.();

    // 리프레시 후 약간의 시간을 둬서 연속 호출 방지
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [refreshData, onRefresh, isRefreshing]);

  // Handle sort change
  const handleSortChange = useCallback(
    (field: SortField) => {
      // Toggle sort direction if clicking the same field
      const direction: SortDirection =
        field === sortField
          ? sortDirection === "asc"
            ? "desc"
            : "asc"
          : "desc";
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
      return sortDirection === "asc" ? (
        <SortAsc size={16} className="ml-1" />
      ) : (
        <SortDesc size={16} className="ml-1" />
      );
    },
    [sortField, sortDirection]
  );

  const handleRemoveFilter = useCallback(
    (type: string, value?: string) => {
      switch (type) {
        case "searchQuery":
          setSearchInput("");
          setSearchQuery("");
          break;
        case "attributeKey":
          setAttributeKeyInput("");
          setAttributeKey("");
          break;
        case "service":
          if (value) {
            const newServices = selectedServices.filter((s) => s !== value);
            setSelectedServices(newServices);
          }
          break;
        case "status":
          if (value) {
            const newStatuses = selectedStatuses.filter((s) => s !== value) as (
              | "OK"
              | "ERROR"
              | "UNSET"
            )[];
            setSelectedStatuses(newStatuses);
          }
          break;
        case "minDuration":
          setMinDuration(undefined);
          setMinDurationInput("");
          break;
        case "maxDuration":
          setMaxDuration(undefined);
          setMaxDurationInput("");
          break;
        case "rootSpansOnly":
          setRootSpansOnly(true);
          break;
        case "limit":
          setLimit(100);
          break;
      }
      // 필터 변경 즉시 반영
      setTimeout(() => onFilterChange?.(), 0);
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

  // 실시간 모드 토글 처리 - 디바운스 추가
  const [isTogglingRealtime, setIsTogglingRealtime] = useState(false);

  const handleToggleRealtime = useCallback(
    (enabled: boolean) => {
      if (isTogglingRealtime) return;
      setIsTogglingRealtime(true);
      onToggleRealtime?.(enabled);
      setTimeout(() => setIsTogglingRealtime(false), 500);
    },
    [onToggleRealtime, isTogglingRealtime]
  );

  const disclosureHelper = useDisclosure();

  // Skip rendering during SSR or when service options are not loaded
  if (isSSR || isEmpty(serviceOptions)) return null;

  return (
    <>
      <Accordion keepContentMounted variant="splitted">
        <AccordionItem
          key="1"
          aria-label="ActiveFilters"
          title={
            hasActiveFilters() ? (
              <ActiveFilters
                filters={{
                  searchQuery: searchQuery || undefined,
                  attributeKey: attributeKey || undefined,
                  selectedServices:
                    selectedServices.length > 0 ? selectedServices : undefined,
                  selectedStatuses:
                    selectedStatuses.length > 0 ? selectedStatuses : undefined,
                  minDuration,
                  maxDuration,
                  rootSpansOnly: rootSpansOnly === false ? false : undefined,
                  limit: limit !== 100 ? limit : undefined,
                }}
                onRemoveFilter={handleRemoveFilter}
              />
            ) : (
              "필터 선택"
            )
          }
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 ${className}`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 items-start lg:items-center">
                <Filter size={18} className="text-gray-500" />
                <SearchField
                  searchInput={searchInput}
                  setSearchInput={setSearchInput}
                />
                <AttributeKeyField
                  attributeKeyInput={attributeKeyInput}
                  setAttributeKeyInput={setAttributeKeyInput}
                  attributeKey={attributeKey}
                  setAttributeKey={setAttributeKey}
                  onFilterChange={onFilterChange}
                />
                {hasActiveFilters() && (
                  <Button
                    size="md"
                    variant="ghost"
                    color="danger"
                    title="필터 초기화"
                    onPress={handleClearFilters}
                  >
                    <X size={16} className="mr-1" />
                    초기화
                  </Button>
                )}
                <RootSpansToggle
                  rootSpansOnly={rootSpansOnly}
                  onChange={handleRootSpansOnlyChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <div className="w-full">
                  <Select
                    label="서비스"
                    placeholder="서비스 선택"
                    selectionMode="multiple"
                    selectedKeys={selectedServices}
                    onSelectionChange={(keys) => {
                      if (typeof keys === "string") return;
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
                            {service.errorRate > 0 && (
                              <span className="ml-1 text-red-500">
                                ({service.errorRate.toFixed(1)}% 오류)
                              </span>
                            )}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Status filter */}
                <div className="w-full">
                  <Select
                    label="상태"
                    placeholder="상태 선택"
                    selectionMode="multiple"
                    selectedKeys={selectedStatuses}
                    onSelectionChange={(keys) => {
                      if (typeof keys === "string") return;
                      handleStatusChange(
                        Array.from(keys) as ("OK" | "ERROR" | "UNSET")[]
                      );
                    }}
                    size="sm"
                    className="w-full"
                  >
                    <SelectItem key="OK" textValue="성공">
                      성공
                    </SelectItem>
                    <SelectItem key="ERROR" textValue="오류">
                      오류
                    </SelectItem>
                    <SelectItem key="UNSET" textValue="미설정">
                      미설정
                    </SelectItem>
                  </Select>
                </div>

                {/* Min duration filter */}
                <div className="w-full">
                  <DurationInput
                    value={minDurationInput}
                    setValue={setMinDurationInput}
                    label="최소 지연 시간(ms)"
                    placeholder="예: 100"
                    currentValue={minDuration}
                    onChange={handleMinDurationChange}
                  />
                </div>

                {/* Max duration filter */}
                <div className="w-full">
                  <DurationInput
                    value={maxDurationInput}
                    setValue={setMaxDurationInput}
                    label="최대 지연 시간(ms)"
                    placeholder="예: 1000"
                    currentValue={maxDuration}
                    onChange={handleMaxDurationChange}
                  />
                </div>

                <div className="w-full">
                  <Select
                    label="표시 개수"
                    size="sm"
                    selectedKeys={[limit.toString()]}
                    onSelectionChange={(keys) => {
                      if (typeof keys === "string") return;
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

                {/* 실시간 설정 컴포넌트 사용 */}
                {onToggleRealtime && (
                  <div className="w-full sm:col-span-2 lg:col-span-1">
                    <RealtimeSettings
                      isRealtime={isRealtime}
                      onToggleRealtime={handleToggleRealtime}
                      refreshInterval={refreshInterval}
                      onRefreshIntervalChange={
                        onRefreshIntervalChange || (() => {})
                      }
                      realtimeRange={realtimeRange}
                      onRealtimeRangeChange={
                        onRealtimeRangeChange || (() => {})
                      }
                    />
                  </div>
                )}
              </div>

              {/* Sort controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <SortAsc size={16} className="text-gray-500" />
                  <span className="text-sm font-medium">정렬:</span>
                </div>

                <SortButtons
                  sortField={sortField}
                  handleSortChange={handleSortChange}
                  renderSortIcon={renderSortIcon}
                />

                {/* 통합된 새로고침 버튼 */}
                <Tooltip content="데이터 새로고침">
                  <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={isRealtime}
                    title="새로고침"
                    onPress={handleRefresh}
                    className="ml-auto"
                  >
                    <RefreshCw size={16} className="mr-1" />
                    새로고침
                  </Button>
                </Tooltip>

                <Button
                  onPress={disclosureHelper.onOpen}
                  size="sm"
                  variant="ghost"
                >
                  <GitCommit size={16} className="mr-1" />
                  <span className="hidden md:inline">트레이스 선택 방법</span>
                </Button>
              </div>
            </div>
          </div>
        </AccordionItem>
      </Accordion>
      <ModalBlushHelp disclosureHelper={disclosureHelper} />
    </>
  );
};

export default TraceFilter;
