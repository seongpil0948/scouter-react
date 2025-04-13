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

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const SearchField = ({
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

export const AttributeKeyField = ({
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

export const DurationInput = ({
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

export const RootSpansToggle = ({ rootSpansOnly, onChange }: { rootSpansOnly: boolean; onChange: (value: boolean) => void }) => (
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

export const SortButtons = ({
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

export const ActiveFilters = ({
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
