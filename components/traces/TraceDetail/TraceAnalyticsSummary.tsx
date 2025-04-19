'use client';

import React, { useMemo } from 'react';
import { Tabs, Tab } from '@heroui/tabs';
import { Badge } from '@heroui/badge';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Tooltip } from '@heroui/tooltip';
import { Database, Globe, AlertTriangle, Clock, ChevronRight, Code, BarChart2, Filter } from 'lucide-react';

import { analyzeTraceSpans } from '@/lib/utils/spanAnalyzer';
import { formatDuration } from '@/lib/utils/dateFormatter';

interface TraceAnalyticsSummaryProps {
  spans: Span[];
  onSelectSpan: (spanId: string) => void;
  onToggleView?: (view: string) => void;
}

const TraceAnalyticsSummary: React.FC<TraceAnalyticsSummaryProps> = ({ 
  spans, 
  onSelectSpan,
  onToggleView
}) => {
  // 스팬 데이터 분석
  const analytics = useMemo(() => {
    return analyzeTraceSpans(spans);
  }, [spans]);
  
  // 서비스별 통계 정렬
  const sortedServices = useMemo(() => {
    return Object.entries(analytics.byService)
      .sort((a, b) => b[1].count - a[1].count);
  }, [analytics.byService]);
  
  // 상태코드별 통계에 색상 지정
  const getStatusCodeColor = (code: string) => {
    if (code.startsWith('2')) return 'success';
    if (code.startsWith('3')) return 'warning';
    if (code.startsWith('4')) return 'warning';
    if (code.startsWith('5')) return 'danger';
    return 'default';
  };
  
  // SQL 탭 내용
  const renderSqlTab = () => {
    if (analytics.sql.count === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          SQL 관련 정보가 없습니다
        </div>
      );
    }
    
    return (
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
        
        <h3 className="text-lg font-medium mt-6 mb-2">SQL 쿼리 목록</h3>
        <div className="overflow-auto max-h-96">
          {analytics.sql.queries.map((sql, index) => (
            <div 
              key={`${sql.spanId}-${index}`} 
              className="border-b last:border-b-0 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
              onClick={() => onSelectSpan(sql.spanId)}
            >
              <div className="flex justify-between mb-1">
                <div className="flex items-center">
                  <Database size={14} className="mr-1 text-blue-500" />
                  <span className="text-sm font-medium">SQL 쿼리</span>
                </div>
                <Badge>{formatDuration(sql.time)}</Badge>
              </div>
              <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
                {sql.query.length > 300 
                  ? sql.query.substring(0, 300) + '...' 
                  : sql.query}
              </pre>
              <div className="flex justify-end mt-1">
                <Button 
                  size="sm" 
                  variant="light" 
                  onPress={() => onSelectSpan(sql.spanId)}
                  endContent={<ChevronRight size={14} />}
                >
                  상세 보기
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // HTTP 탭 내용
  const renderHttpTab = () => {
    if (analytics.http.count === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          HTTP/URL 관련 정보가 없습니다
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
            <div className="text-sm text-gray-500">HTTP 요청 수</div>
            <div className="text-2xl font-bold">{analytics.http.count}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
            <div className="text-sm text-gray-500">HTTP 메서드</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(analytics.http.byMethod).map(([method, count]) => (
                <Badge key={method} color="success" variant="flat">
                  {method}: {count}
                </Badge>
              ))}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
            <div className="text-sm text-gray-500">상태 코드</div>
            <div className="flex flex-wrap gap-1 mt-1">
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
          {analytics.http.urls.map((http, index) => (
            <div 
              key={`${http.spanId}-${index}`} 
              className="border-b last:border-b-0 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
              onClick={() => onSelectSpan(http.spanId)}
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
              <div className="flex justify-end mt-1">
                <Button 
                  size="sm" 
                  variant="light" 
                  onPress={() => onSelectSpan(http.spanId)}
                  endContent={<ChevronRight size={14} />}
                >
                  상세 보기
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // 오류 탭 내용
  const renderErrorsTab = () => {
    if (analytics.errors.count === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          오류 정보가 없습니다
        </div>
      );
    }
    
    return (
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
              className="border-b last:border-b-0 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
              onClick={() => onSelectSpan(error.spanId)}
            >
              <div className="flex items-center mb-1">
                <AlertTriangle size={14} className="mr-1 text-red-500" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Error</span>
              </div>
              <div className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-md text-red-700 dark:text-red-300">
                {error.message}
              </div>
              <div className="flex justify-end mt-1">
                <Button 
                  size="sm" 
                  variant="light" 
                  color="danger"
                  onPress={() => onSelectSpan(error.spanId)}
                  endContent={<ChevronRight size={14} />}
                >
                  상세 보기
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // 서비스 탭 내용
  const renderServicesTab = () => {
    return (
      <div className="space-y-4">
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
              {sortedServices.map(([service, stats]) => (
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
    );
  };
  
  // 지연 시간 탭 내용
  const renderLatencyTab = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium mb-2">상위 지연 시간 스팬</h3>
        <div className="overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-2 text-left">이름</th>
                <th className="px-4 py-2 text-center">서비스</th>
                <th className="px-4 py-2 text-right">지연 시간</th>
                <th className="px-4 py-2 text-center">상세</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topLatencySpans.map((span) => (
                <tr key={span.spanId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-2 font-mono text-sm">
                    <Tooltip content={span.name}>
                      <span className="truncate block max-w-xs">
                        {span.name.length > 50 ? span.name.substring(0, 50) + '...' : span.name}
                      </span>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Badge color="primary" variant="flat">{span.serviceName}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {formatDuration(span.duration)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Button 
                      size="sm" 
                      variant="light" 
                      isIconOnly
                      onPress={() => onSelectSpan(span.spanId)}
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  return (
    <Card>
      <CardBody className="p-0">
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b">
          <h2 className="text-lg font-medium">트레이스 분석 요약</h2>
          
          {onToggleView && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="flat" 
                onPress={() => onToggleView('timeline')}
                startContent={<Clock size={14} />}
              >
                타임라인 보기
              </Button>
              <Button 
                size="sm" 
                variant="flat" 
                onPress={() => onToggleView('list')}
                startContent={<Filter size={14} />}
              >
                스팬 목록 보기
              </Button>
            </div>
          )}
        </div>
        
        <Tabs aria-label="트레이스 분석 탭">
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
              {renderSqlTab()}
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
              {renderHttpTab()}
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
              {renderErrorsTab()}
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
              {renderServicesTab()}
            </div>
          </Tab>
          <Tab
            key="latency"
            title={
              <div className="flex items-center">
                <BarChart2 size={16} className="mr-1" />
                지연 시간
              </div>
            }
          >
            <div className="p-4">
              {renderLatencyTab()}
            </div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
};

export default TraceAnalyticsSummary;