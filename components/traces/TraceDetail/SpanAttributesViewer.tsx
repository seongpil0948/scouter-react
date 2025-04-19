'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Badge } from '@heroui/badge';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Tooltip } from '@heroui/tooltip';
import { Accordion, AccordionItem } from '@heroui/accordion';
import { Search, Check, X, Copy, Eye } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils/clipboard';

interface SpanAttributesViewerProps {
  attributes: Record<string, any> | undefined;
  className?: string;
}

const SpanAttributesViewer: React.FC<SpanAttributesViewerProps> = ({ attributes, className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedValues, setExpandedValues] = useState<Set<string>>(new Set());

  // Convert value to string
  const formatValue = useCallback((value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }, []);

  // Get color by value type
  const getValueColor = useCallback((value: any): string => {
    if (value === null || value === undefined) return 'text-gray-400';
    if (typeof value === 'number') return 'text-blue-600 dark:text-blue-400';
    if (typeof value === 'boolean') return 'text-purple-600 dark:text-purple-400';
    if (typeof value === 'object') return 'text-green-600 dark:text-green-400';
    return 'text-gray-800 dark:text-gray-200';
  }, []);

  // Group attributes by prefix
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

  // Copy to clipboard with format
  const copyToClipboardFormatted = useCallback(
    (key: string, value: any) => {
      const textValue = formatValue(value);
      copyToClipboard(textValue)?.then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      });
    },
    [formatValue]
  );

  // Toggle expand/collapse
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

  // Filter attributes by search query
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

  // Group keys
  const groupedKeys = useMemo(() => {
    return groupKeys(Object.keys(filteredAttributes));
  }, [filteredAttributes, groupKeys]);

  // No attributes case
  if (!attributes || Object.keys(attributes).length === 0) {
    return (
      <Card className={className}>
        <CardBody className="py-8 text-center">
          <p className="text-gray-500">This span has no attributes.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {/* Search bar */}
      <CardHeader className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            className="pl-10 w-full"
            placeholder="Search attribute name or value..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            endContent={
              searchQuery && (
                <Button isIconOnly size="sm" variant="light" onPress={() => setSearchQuery('')}>
                  <X size={16} />
                </Button>
              )
            }
          />
        </div>
      </CardHeader>

      {/* Attributes display */}
      <CardBody className="p-0 max-h-96 overflow-auto">
        {Object.keys(groupedKeys).length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-500">No results found.</p>
          </div>
        ) : (
          <Accordion>
            {Object.entries(groupedKeys).map(([group, keys]) => (
              <AccordionItem 
                key={group} 
                title={
                  <div className="flex items-center">
                    <span className="font-medium">{group}</span>
                    <Badge className="ml-2 text-xs">{keys.length}</Badge>
                  </div>
                }
              >
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
                              <Tooltip content={isExpanded ? 'Collapse' : 'Expand'}>
                                <Button isIconOnly size="sm" variant="light" onPress={() => toggleExpand(key)}>
                                  <Eye size={14} />
                                </Button>
                              </Tooltip>
                            )}
                            <Tooltip content="Copy value">
                              <Button isIconOnly size="sm" variant="light" onPress={() => copyToClipboardFormatted(key, value)}>
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
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardBody>
    </Card>
  );
};

export default SpanAttributesViewer;