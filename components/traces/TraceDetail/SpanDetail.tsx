'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { Badge } from '@heroui/badge';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import { CopyIcon, ClockIcon, ServerIcon, Database, Globe } from 'lucide-react';
import { Tooltip } from '@heroui/tooltip';
import { addToast } from '@heroui/toast';

import { formatDateTime } from '@/lib/utils/dateFormatter';
import SpanAttributesViewer from './SpanAttributesViewer';
import SqlAttributesViewer from './SqlAttributesViewer';
import UrlAttributesViewer from './UrlAttributesViewer';
import { copyToClipboard } from '@/lib/utils/clipboard';

interface Span {
  id: string;
  name: string;
  serviceName: string;
  startTime: number;
  endTime: number;
  duration: number;
  parentSpanId?: string;
  attributes?: Record<string, any>;
  status?: string;
  traceId: string;
  spanId: string;
}

interface SpanDetailProps {
  span: Span;
  formatDuration: (duration: number) => string;
  childrenCount?: number;
  onParentClick?: (spanId: string) => void;
}

export const SpanDetail: React.FC<SpanDetailProps> = React.memo(({ span, formatDuration, childrenCount = 0, onParentClick }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');



  // 상태에 따른 색상 결정
  const getStatusColor = useCallback((status?: string) => {
    if (status === 'ERROR') return 'danger';
    if (status === 'OK') return 'success';
    return 'default';
  }, []);

  // SQL 관련 속성 여부 확인
  const hasSqlAttributes = useMemo(() => {
    if (!span.attributes) return false;
    
    return Object.keys(span.attributes).some(key => 
      key.startsWith('sql.') || 
      key === 'db.statement' || 
      key === 'db.operation' ||
      key.includes('query')
    );
  }, [span.attributes]);

  // URL 관련 속성 여부 확인
  const hasUrlAttributes = useMemo(() => {
    if (!span.attributes) return false;
    
    return Object.keys(span.attributes).some(key => 
      key.startsWith('url.') || 
      key.startsWith('http.') || 
      key.includes('path')
    );
  }, [span.attributes]);

  return (
    <div className="mt-4 space-y-6">
      {/* 스팬 요약 정보 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">이름:</span>
            <span className="font-medium">{span.name}</span>
          </div>

          <div className="flex items-center">
            <span className="text-gray-500 mr-2">서비스:</span>
            <Badge color="primary">{span.serviceName}</Badge>
          </div>

          <div className="flex items-center">
            <span className="text-gray-500 mr-2">상태:</span>
            <Badge color={getStatusColor(span.status)}>{span.status || 'UNSET'}</Badge>
          </div>

          <div className="flex items-center">
            <ClockIcon size={16} className="text-gray-500 mr-1" />
            <span className="text-gray-500 mr-2">지연 시간:</span>
            <span className="font-medium">{formatDuration(span.duration)}</span>
          </div>

          {childrenCount > 0 && (
            <div className="flex items-center">
              <ServerIcon size={16} className="text-gray-500 mr-1" />
              <span className="text-gray-500 mr-2">하위 스팬:</span>
              <span className="font-medium">{childrenCount}개</span>
            </div>
          )}
        </div>
      </div>

      {/* 상세 정보 탭 */}
      <Tabs selectedKey={activeTab} onSelectionChange={(k) => setActiveTab(String(k))}>
        <Tab key="overview" title="개요" />
        {hasSqlAttributes && (
          <Tab 
            key="sql" 
            title={
              <div className="flex items-center">
                <Database size={16} className="mr-1" />
                SQL
              </div>
            } 
          />
        )}
        {hasUrlAttributes && (
          <Tab 
            key="url" 
            title={
              <div className="flex items-center">
                <Globe size={16} className="mr-1" />
                URL
              </div>
            } 
          />
        )}
        <Tab key="attributes" title={`속성 (${span.attributes ? Object.keys(span.attributes).length : 0})`} />
        <Tab key="timeline" title="타임라인" />
      </Tabs>

      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="overflow-hidden bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b dark:border-gray-700 font-medium">스팬 상세 정보</div>
              <div className="divide-y dark:divide-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">기본 정보</h4>
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="py-2 pr-4 text-gray-500 text-sm">스팬 ID</td>
                          <td className="py-2 font-mono text-sm flex items-center">
                            {span.spanId}
                            <Button
                              className="ml-2"
                              size="sm"
                              variant="ghost"
                              isIconOnly
                              onPress={() => copyToClipboard(span.spanId, '스팬 ID')}
                            >
                              <CopyIcon size={14} />
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 text-gray-500 text-sm">트레이스 ID</td>
                          <td className="py-2 font-mono text-sm flex items-center">
                            {span.traceId}
                            <Button
                              className="ml-2"
                              size="sm"
                              variant="ghost"
                              isIconOnly
                              onPress={() => copyToClipboard(span.traceId, '트레이스 ID')}
                            >
                              <CopyIcon size={14} />
                            </Button>
                          </td>
                        </tr>
                        {span.parentSpanId && (
                          <tr>
                            <td className="py-2 pr-4 text-gray-500 text-sm">부모 스팬 ID</td>
                            <td className="py-2 font-mono text-sm flex items-center">
                              {span.parentSpanId}
                              <Tooltip content="부모 스팬으로 이동">
                                <Button
                                  className="ml-2"
                                  size="sm"
                                  variant="ghost"
                                  isIconOnly
                                  onPress={() => onParentClick?.(span.parentSpanId!)}
                                >
                                  <ServerIcon size={14} />
                                </Button>
                              </Tooltip>
                              <Button
                                className="ml-1"
                                size="sm"
                                variant="ghost"
                                isIconOnly
                                onPress={() => copyToClipboard(span.parentSpanId!, '부모 스팬 ID')}
                              >
                                <CopyIcon size={14} />
                              </Button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">시간 정보</h4>
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="py-2 pr-4 text-gray-500 text-sm">시작 시간</td>
                          <td className="py-2 text-sm">{formatDateTime(span.startTime)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 text-gray-500 text-sm">종료 시간</td>
                          <td className="py-2 text-sm">{formatDateTime(span.endTime)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 text-gray-500 text-sm">총 지연 시간</td>
                          <td className="py-2 text-sm font-medium">{formatDuration(span.duration)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* 주요 속성 미리보기 */}
            {span.attributes && Object.keys(span.attributes).length > 0 && (
              <div className="overflow-hidden bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b dark:border-gray-700 font-medium flex justify-between">
                  <span>주요 속성</span>
                  <div className="flex gap-2">
                    {hasSqlAttributes && (
                      <Button size="sm" variant="ghost" onPress={() => setActiveTab('sql')}>
                        <Database size={14} className="mr-1" />
                        SQL 보기
                      </Button>
                    )}
                    {hasUrlAttributes && (
                      <Button size="sm" variant="ghost" onPress={() => setActiveTab('url')}>
                        <Globe size={14} className="mr-1" />
                        URL 보기
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onPress={() => setActiveTab('attributes')}>
                      모든 속성 보기
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  {(() => {
                    // 중요 속성 우선순위 (필수 속성 우선)
                    const importantKeys = [
                      'url.query',
                      'sql.elapsed',
                      'sql.query',
                      'url.path',
                      'http.method',
                      'http.url',
                      'http.status_code',
                      'db.operation',
                      'db.statement',
                      'error.message',
                      'error.stack',
                    ];

                    // 우선순위에 따라 중요 속성 추출
                    const importantAttrs: Record<string, any> = {};

                    // 먼저 우선순위가 높은 속성 추가
                    importantKeys.forEach((key) => {
                      if (span.attributes && key in span.attributes) {
                        importantAttrs[key] = span.attributes[key];
                      }
                    });

                    // 다른 속성 (최대 5개)
                    const otherKeys = Object.keys(span.attributes)
                      .filter((key) => !importantKeys.includes(key))
                      .slice(0, 5 - Object.keys(importantAttrs).length);

                    otherKeys.forEach((key) => {
                      importantAttrs[key] = span.attributes![key];
                    });

                    if (Object.keys(importantAttrs).length === 0) {
                      return <p className="text-gray-500 text-sm">표시할 주요 속성이 없습니다.</p>;
                    }

                    return (
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(importantAttrs).map(([key, value]) => (
                          <div key={key} className="flex flex-col p-2 border rounded-md">
                            <div className="text-xs text-gray-500 mb-1">{key}</div>
                            <div className="font-mono text-sm break-all">
                              {typeof value === 'object'
                                ? JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '')
                                : String(value).substring(0, 100) + (String(value).length > 100 ? '...' : '')}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SQL 전용 탭 */}
        {activeTab === 'sql' && <SqlAttributesViewer attributes={span.attributes} />}

        {/* URL 전용 탭 */}
        {activeTab === 'url' && <UrlAttributesViewer attributes={span.attributes} />}

        {/* 모든 속성 탭 */}
        {activeTab === 'attributes' && <SpanAttributesViewer attributes={span.attributes} />}

        {activeTab === 'timeline' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
            <div className="relative">
              {/* 타임라인 눈금 */}
              <div className="h-8 flex">
                {[0, 25, 50, 75, 100].map((percent) => (
                  <div key={percent} className="flex-1 border-r last:border-r-0 relative">
                    <span className="absolute transform -translate-x-1/2 text-xs text-gray-500">{percent}%</span>
                  </div>
                ))}
              </div>

              {/* 스팬 타임라인 표시 */}
              <div className="h-12 relative bg-gray-100 dark:bg-gray-700 rounded-md">
                <Tooltip content={`${formatDuration(span.duration)} (${span.duration}ms)`}>
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 h-6 rounded-sm"
                    style={{
                      width: '100%',
                      backgroundColor: span.status === 'ERROR' ? '#f87171' : '#60a5fa',
                    }}
                  />
                </Tooltip>
              </div>

              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>{formatDateTime(span.startTime)}</span>
                <span>{formatDateTime(span.endTime)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

SpanDetail.displayName = 'SpanDetail';