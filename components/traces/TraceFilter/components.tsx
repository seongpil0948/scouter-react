'use client';

import { Badge } from '@heroui/badge';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Switch } from '@heroui/switch';
import { Search, X, GitCommit } from 'lucide-react';

import { formatDuration } from '@/lib/utils/dateFormatter';
import { SortField } from '@/lib/store/traceFilterStore';

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
      aria-label="이름, 서비스, 트레이스 ID 검색"
      role="search"
    />
    {searchInput && (
      <button
        type="button"
        aria-label="검색어 지우기"
        role="button"
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
      aria-label="속성 키 필터"
      role="textbox"
      type="text"
      placeholder="예: sql.query, http.method"
      value={attributeKeyInput}
      onChange={(e) => setAttributeKeyInput(e.target.value)}
      onBlur={() => {
        // 공백 제거 및 트림 처리
        const trimmedValue = attributeKeyInput.trim();
        if (trimmedValue !== attributeKey) {
          setAttributeKey(trimmedValue);
          onFilterChange?.();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          // 엔터키 누를 때도 공백 제거 및 트림 처리
          const trimmedValue = attributeKeyInput.trim();
          if (trimmedValue !== attributeKey) {
            setAttributeKey(trimmedValue);
            onFilterChange?.();
          }
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
      aria-label={label}
      role="textbox"
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
      <Switch aria-label="루트 스팬만 보기" role="switch" isSelected={rootSpansOnly} onValueChange={onChange} size="sm" />
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
      aria-label="정렬 기준: 시작 시간"
      role="button"
    >
      시간
      {renderSortIcon('startTime')}
    </Button>

    <Button
      size="sm"
      variant={sortField === 'duration' ? 'solid' : 'ghost'}
      color={sortField === 'duration' ? 'primary' : 'default'}
      onPress={() => handleSortChange('duration')}
      aria-label="정렬 기준: 지연 시간"
      role="button"
    >
      지연 시간
      {renderSortIcon('duration')}
    </Button>

    <Button
      size="sm"
      variant={sortField === 'serviceName' ? 'solid' : 'ghost'}
      color={sortField === 'serviceName' ? 'primary' : 'default'}
      onPress={() => handleSortChange('serviceName')}
      aria-label="정렬 기준: 서비스 이름"
      role="button"
    >
      서비스
      {renderSortIcon('serviceName')}
    </Button>

    <Button
      size="sm"
      variant={sortField === 'status' ? 'solid' : 'ghost'}
      color={sortField === 'status' ? 'primary' : 'default'}
      onPress={() => handleSortChange('status')}
      aria-label="정렬 기준: 상태"
      role="button"
    >
      상태
      {renderSortIcon('status')}
    </Button>

    <Button
      size="sm"
      variant={sortField === 'name' ? 'solid' : 'ghost'}
      color={sortField === 'name' ? 'primary' : 'default'}
      onPress={() => handleSortChange('name')}
      aria-label="정렬 기준: 이름"
      role="button"
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
