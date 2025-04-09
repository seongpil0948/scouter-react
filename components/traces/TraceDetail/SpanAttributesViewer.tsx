'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Badge } from '@heroui/badge';
import { Search, Check, X, Copy, Eye } from 'lucide-react';
import { Tooltip } from '@heroui/tooltip';

interface SpanAttributesViewerProps {
  attributes: Record<string, any> | undefined;
  className?: string;
}

const SpanAttributesViewer: React.FC<SpanAttributesViewerProps> = ({ attributes, className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedValues, setExpandedValues] = useState<Set<string>>(new Set());

  // 값을 문자열로 변환하는 함수
  const formatValue = useCallback((value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }, []);

  // 값의 타입에 따라 색상 결정
  const getValueColor = useCallback((value: any): string => {
    if (value === null || value === undefined) return 'text-gray-400';
    if (typeof value === 'number') return 'text-blue-600 dark:text-blue-400';
    if (typeof value === 'boolean') return 'text-purple-600 dark:text-purple-400';
    if (typeof value === 'object') return 'text-green-600 dark:text-green-400';
    return 'text-gray-800 dark:text-gray-200';
  }, []);

  // 키를 그룹화하는 함수
  const groupKeys = useCallback((keys: string[]): Record<string, string[]> => {
    const groups: Record<string, string[]> = {};

    keys.forEach((key) => {
      const parts = key.split('.');
      const group = parts.length > 1 ? parts[0] : 'other';

      if (!groups[group]) {
        groups[group] = [];
      }

      groups[group].push(key);
    });

    return groups;
  }, []);

  // 값 복사 함수
  const copyToClipboard = useCallback(
    (key: string, value: any) => {
      const textValue = formatValue(value);
      navigator.clipboard.writeText(textValue).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      });
    },
    [formatValue]
  );

  // 값 확장/축소 토글
  const toggleExpand = useCallback((key: string) => {
    setExpandedValues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  // 검색어에 따라 필터링된 속성
  const filteredAttributes = useMemo(() => {
    if (!attributes) return {};

    if (!searchQuery) return attributes;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, any> = {};

    Object.entries(attributes).forEach(([key, value]) => {
      const stringValue = formatValue(value).toLowerCase();

      if (key.toLowerCase().includes(query) || stringValue.includes(query)) {
        filtered[key] = value;
      }
    });

    return filtered;
  }, [attributes, searchQuery, formatValue]);

  // 그룹화된 키
  const groupedKeys = useMemo(() => {
    return groupKeys(Object.keys(filteredAttributes));
  }, [filteredAttributes, groupKeys]);

  // 속성이 없는 경우
  if (!attributes || Object.keys(attributes).length === 0) {
    return (
      <div className={`${className} p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-md`}>
        <p className="text-gray-500">이 스팬에는 속성이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={`${className} bg-white dark:bg-gray-800 rounded-lg overflow-hidden`}>
      {/* 검색 영역 */}
      <div className="mb-3 sticky top-0 z-10 bg-white dark:bg-gray-800 p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            className="pl-10 w-full"
            placeholder="속성 이름 또는 값 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <X
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600"
              size={16}
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>
      </div>

      {/* 속성 표시 영역 */}
      <div className="max-h-96 overflow-auto">
        {Object.keys(groupedKeys).length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedKeys).map(([group, keys]) => (
              <div key={group} className="border-b dark:border-gray-700 last:border-0">
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 font-medium text-sm sticky top-0">
                  {group}
                  <Badge className="ml-2 text-xs">{keys.length}</Badge>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {keys.map((key) => {
                    const value = filteredAttributes[key];
                    const formattedValue = formatValue(value);
                    const isLongValue = formattedValue.length > 50 || formattedValue.includes('\n');
                    const isExpanded = expandedValues.has(key);
                    const displayValue = isLongValue && !isExpanded ? formattedValue.substring(0, 50) + '...' : formattedValue;

                    return (
                      <div key={key} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-750">
                        <div className="flex items-start justify-between">
                          <div className="font-mono text-sm text-gray-700 dark:text-gray-300 break-all">{key}</div>
                          <div className="flex gap-1 ml-2">
                            {isLongValue && (
                              <Tooltip content={isExpanded ? '접기' : '펼치기'}>
                                <Button isIconOnly size="sm" variant="light" onPress={() => toggleExpand(key)}>
                                  <Eye size={14} />
                                </Button>
                              </Tooltip>
                            )}
                            <Tooltip content="값 복사">
                              <Button isIconOnly size="sm" variant="light" onPress={() => copyToClipboard(key, value)}>
                                {copiedKey === key ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                              </Button>
                            </Tooltip>
                          </div>
                        </div>

                        <div className={`mt-1 font-mono text-sm break-all whitespace-pre-wrap ${getValueColor(value)}`}>
                          {typeof value === 'object' && value !== null ? (
                            <pre className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md overflow-auto">{displayValue}</pre>
                          ) : (
                            displayValue
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpanAttributesViewer;
