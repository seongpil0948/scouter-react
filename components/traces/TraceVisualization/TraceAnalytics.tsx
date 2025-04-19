'use client';

import React, { useMemo } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Badge } from '@heroui/badge';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import { Tooltip } from '@heroui/tooltip';
import { Database, Globe, AlertTriangle, BarChart2, Code, ChevronRight } from 'lucide-react';

import { analyzeTraceSpans } from '@/lib/utils/spanAnalyzer';
import { formatDuration } from '@/lib/utils/dateFormatter';

interface TraceAnalyticsProps {
  traces: TraceItem[];
  onTraceSelect?: (traceId: string) => void;
  className?: string;
}

/**
 * 여러 트레이스에 대한 통합 분석 컴포넌트
 */
const TraceAnalytics: React.FC<TraceAnalyticsProps> = ({ 
  traces,
  onTraceSelect,
  className = ''
}) => {
  // 모든 트레이스에서 스팬 추출
  const allSpans = useMemo(() => {
    return traces.reduce((spans: Span[], trace) => {
      spans.push({
        id: trace.id,
        traceId: trace.traceId,
        spanId: trace.id, // trace.id를 spanId로 사용
        name: trace.name,
        serviceName: trace.serviceName,
        startTime: trace.startTime,
        endTime: trace.startTime + trace.duration,
        duration: trace.duration,
        status: trace.status,
        attributes: trace.attributes || {}
      });
      return spans;
    }, []);
  }, [traces]);
  
  // 스팬 분석
  const analytics = useMemo(() => {
    return analyzeTraceSpans(allSpans);
  }, [allSpans]);
  
  // 스팬수가 적거나 없는 경우
  if (allSpans.length < 2) {
    return (
      <Card className={className}>
        <CardBody className="p-4 text-center">
          <p className="text-gray-500">분석할 충분한 스팬 데이터가 없습니다</p>
          <p className="text-sm text-gray-400 mt-2">트레이스 목록에서 트레이스를 선택하여 자세한 분석을 확인하세요</p>
        </CardBody>
      </Card>
    );
  }
  
  // 상태코드별 색상 지정
  const getStatusCodeColor = (code: string) => {
    if (code.startsWith('2')) return 'success';
    if (code.startsWith('3')) return 'warning';
    if (code.startsWith('4')) return 'warning';
    if (code.startsWith('5')) return 'danger';
    return 'default';
  };
  
  return (
    <Card className={className}>
      <CardBody className="p-0">
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b">
          <h2 className="text-lg font-medium">시스템 분석 요약</h2>
        </div>
        
        <Tabs aria-label="시스템 분석 탭">
          <Tab
            key="overview"
            title={
              <div className="flex items-center">
                <BarChart2 size={16} className="mr-1" />
                개요
              </div>
            }
          >
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                  <div className="text-sm text-gray-500">SQL 쿼리</div>
                  <div className="flex items-center mt-1">
                    <Database size={16} className="text-blue-500 mr-2" />
                    <div className="text-2xl font-bold">{analytics.sql.count}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">평균 실행 시간</div>
                  <div className="text-lg font-medium">{formatDuration(analytics.sql.avgTime)}</div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                  <div className="text-sm text-gray-500">HTTP 요청</div>
                  <div className="flex items-center mt-1">
                    <Globe size={16} className="text-green-500 mr-2" />
                    <div className="text-2xl font-bold">{analytics.http.count}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(analytics.http.byStatusCode).slice(0, 4).map(([code, count]) => (
                      <Badge key={code} color={getStatusCodeColor(code)} variant="flat">
                        {code}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                  <div className="text-sm text-gray-500">오류</div>
                  <div className="flex items-center mt-1">
                    <AlertTriangle size={16} className="text-red-500 mr-2" />
                    <div className="text-2xl font-bold">{analytics.errors.count}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">서비스</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(analytics.byService)
                      .filter(([_, stats]) => stats.errorCount > 0)
                      .slice(0, 3)
                      .map(([service, stats]) => (
                        <Badge key={service} color="danger" variant="flat">
                          {service}: {stats.errorCount}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-medium mb-2">상위 지연 시간</h3>
              <div className="overflow-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-4 py-2 text-left">이름</th>
                      <th className="px-4 py-2 text-center">서비스</th>
                      <th className="px-4 py-2 text-right">지연 시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topLatencySpans.slice(0, 5).map((span) => (
                      <tr key={span.spanId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-4 py-2 font-mono text-sm">
                          <Tooltip content={span.name}>
                            <span className="truncate block max-w-xs">
                              {span.name.length > 40 ? span.name.substring(0, 40) + '...' : span.name}
                            </span>
                          </Tooltip>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Badge color="primary" variant="flat">{span.serviceName}</Badge>
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {formatDuration(span.duration)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Tab>
          
          <Tab
            key="sql"
            title={
              <div className="flex items-center">
                <Database size={16} className="mr-1" />
                SQL ({analytics.sql.count})
              </div>
            }
          >
            <div className="p-4">
              {analytics.sql.count === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  SQL 관련 정보가 없습니다
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                      <div className="text-sm text-gray-500">SQL 쿼리 수</div>
                      <div className="text-2xl font-bold">{analytics.sql.count}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                      <div className="text-sm text-gray-500">평균 실행 시간</div>
                      <div className="text-2xl font-bold">{formatDuration(analytics.sql.avgTime)}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                      <div className="text-sm text-gray-500">최대 실행 시간</div>
                      <div className="text-2xl font-bold">{formatDuration(analytics.sql.maxTime)}</div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium mt-6 mb-2">상위 SQL 쿼리</h3>
                  <div className="overflow-auto max-h-96">
                    {analytics.sql.queries
                      .sort((a, b) => b.time - a.time)
                      .slice(0, 5)
                      .map((sql, index) => (
                        <div 
                          key={`${sql.spanId}-${index}`} 
                          className="border-b last:border-b-0 py-3 hover:bg-gray-50 dark:hover:bg-gray-750"
                        >
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center">
                              <Database size={14} className="mr-1 text-blue-500" />
                              <span className="text-sm font-medium">SQL 쿼리</span>
                            </div>
                            <Badge>{formatDuration(sql.time)}</Badge>
                          </div>
                          <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
                            {sql.query.length > 200 
                              ? sql.query.substring(0, 200) + '...' 
                              : sql.query}
                          </pre>
                          {onTraceSelect && (
                            <div className="flex justify-end mt-1">
                              <Button 
                                size="sm" 
                                variant="light" 
                                endContent={<ChevronRight size={14} />}
                              >
                                자세히 보기
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </Tab>
          
          <Tab
            key="http"
            title={
              <div className="flex items-center">
                <Globe size={16} className="mr-1" />
                HTTP ({analytics.http.count})
              </div>
            }
          >
            <div className="p-4">
              {analytics.http.count === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  HTTP/URL 관련 정보가 없습니다
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                      <div className="text-sm text-gray-500">HTTP 메서드</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(analytics.http.byMethod).map(([method, count]) => (
                          <Badge key={method} color="success" variant="flat">
                            {method}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                      <div className="text-sm text-gray-500">상태 코드</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(analytics.http.byStatusCode).map(([code, count]) => (
                          <Badge key={code} color={getStatusCodeColor(code)} variant="flat">
                            {code}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium mt-6 mb-2">URL 목록</h3>
                  <div className="overflow-auto max-h-96">
                    {analytics.http.urls.slice(0, 10).map((http, index) => (
                      <div 
                        key={`${http.spanId}-${index}`} 
                        className="border-b last:border-b-0 py-3 hover:bg-gray-50 dark:hover:bg-gray-750"
                      >
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <Globe size={14} className="mr-1 text-green-500" />
                            <span className="text-sm font-medium">
                              {http.method} 요청
                            </span>
                          </div>
                          {http.statusCode && (
                            <Badge color={getStatusCodeColor(http.statusCode)}>
                              {http.statusCode}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded-md break-all">
                          {http.url}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Tab>
          
          <Tab
            key="errors"
            title={
              <div className="flex items-center">
                <AlertTriangle size={16} className="mr-1" />
                오류 ({analytics.errors.count})
              </div>
            }
          >
            <div className="p-4">
              {analytics.errors.count === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  오류 정보가 없습니다
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
                    <div className="text-sm text-gray-500">총 오류 수</div>
                    <div className="text-2xl font-bold">{analytics.errors.count}</div>
                  </div>
                  
                  <h3 className="text-lg font-medium mt-6 mb-2">오류 메시지</h3>
                  <div className="overflow-auto max-h-96">
                    {analytics.errors.messages.map((error, index) => (
                      <div 
                        key={`${error.spanId}-${index}`} 
                        className="border-b last:border-b-0 py-3 hover:bg-gray-50 dark:hover:bg-gray-750"
                      >
                        <div className="flex items-center mb-1">
                          <AlertTriangle size={14} className="mr-1 text-red-500" />
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">Error</span>
                        </div>
                        <div className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-md text-red-700 dark:text-red-300">
                          {error.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Tab>
          
          <Tab
            key="services"
            title={
              <div className="flex items-center">
                <Code size={16} className="mr-1" />
                서비스 ({Object.keys(analytics.byService).length})
              </div>
            }
          >
            <div className="p-4">
              <h3 className="text-lg font-medium mb-2">서비스별 통계</h3>
              <div className="overflow-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-4 py-2 text-left">서비스</th>
                      <th className="px-4 py-2 text-center">스팬 수</th>
                      <th className="px-4 py-2 text-center">오류 수</th>
                      <th className="px-4 py-2 text-right">평균 지연 시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(analytics.byService)
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([service, stats]) => (
                        <tr key={service} className="border-b hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-4 py-2">
                            <Badge color="primary" variant="flat">{service}</Badge>
                          </td>
                          <td className="px-4 py-2 text-center">{stats.count}</td>
                          <td className="px-4 py-2 text-center">
                            {stats.errorCount > 0 ? (
                              <Badge color="danger">{stats.errorCount}</Badge>
                            ) : (
                              <Badge color="success">0</Badge>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatDuration(stats.avgDuration)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
};

export default TraceAnalytics;