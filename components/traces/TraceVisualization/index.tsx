"use client";

import React, { useMemo, useCallback, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { 
  RefreshCw, 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  BarChart2
} from "lucide-react";

import { useTraceChart } from './hooks/useTraceChart';
import { useChartStore, refreshChart } from '@/lib/store/chartStore';
import { formatDuration } from '@/lib/utils/dateFormatter';


export const TraceVisualization: React.FC<TraceVisualizationProps> = ({
  traceData,
  onDataPointClick,
  config = {},
  onRefresh,
  title,
  showFilters = false,
}) => {
  const { 
    updateConfig, 
    isRefreshing,
    legendState,
    toggleLegend,
    dataFilters,
    updateDataFilters
  } = useChartStore();

  // 스토어 설정 업데이트
  useEffect(() => {
    if (Object.keys(config).length > 0) {
      updateConfig(config);
    }
  }, [config, updateConfig]);

  const { chartRef, isLoading, chartHeight } = useTraceChart({
    traceData, 
    onDataPointClick,
    config
  });

  // 서비스 목록 추출
  const services = useMemo(() => {
    const serviceSet = new Set<string>();
    traceData.forEach(trace => {
      if (trace.serviceName) {
        serviceSet.add(trace.serviceName);
      }
    });
    return Array.from(serviceSet).sort();
  }, [traceData]);

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    if (!dataFilters.minDuration && !dataFilters.maxDuration && 
        !dataFilters.serviceFilter && !dataFilters.statusFilter) {
      return traceData;
    }

    return traceData.filter(trace => {
      // 지연 시간 필터
      if (dataFilters.minDuration && trace.duration < dataFilters.minDuration) {
        return false;
      }
      if (dataFilters.maxDuration && trace.duration > dataFilters.maxDuration) {
        return false;
      }
      
      // 서비스 필터
      if (dataFilters.serviceFilter && trace.serviceName !== dataFilters.serviceFilter) {
        return false;
      }
      
      // 상태 필터
      if (dataFilters.statusFilter && trace.status !== dataFilters.statusFilter) {
        return false;
      }
      
      return true;
    });
  }, [traceData, dataFilters]);

  // 지연 시간 통계
  const latencyStats = useMemo(() => {
    if (traceData.length === 0) {
      return { min: 0, max: 0, avg: 0, p90: 0 };
    }
    
    const durations = traceData.map(t => t.duration).sort((a, b) => a - b);
    const min = durations[0];
    const max = durations[durations.length - 1];
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const p90Index = Math.floor(durations.length * 0.9);
    const p90 = durations[p90Index];
    
    return { min, max, avg, p90 };
  }, [traceData]);

  // 새로고침 처리
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await refreshChart(onRefresh);
    }
  }, [onRefresh]);

  return (
    <Card className="w-full">
      <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-lg font-medium">
          {title || config.title || '트레이스 시각화'}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            <Badge 
              className={`cursor-pointer ${legendState.normal ? 'bg-blue-500' : 'bg-gray-300 text-gray-700'}`}
              onClick={() => toggleLegend('normal')}
            >
              일반 요청
            </Badge>
            <Badge 
              className={`cursor-pointer ${legendState.highLatency ? 'bg-red-500' : 'bg-gray-300 text-gray-700'}`}
              onClick={() => toggleLegend('highLatency')}
            >
              고지연 요청
            </Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            startContent={<RefreshCw size={16} />}
            onPress={handleRefresh}
            isDisabled={isRefreshing}
          >
            새로고침
          </Button>
        </div>
      </div>

      {/* 필터 섹션 */}
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-1">
              <Filter size={16} />
              <span className="text-sm font-medium">필터:</span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* 서비스 필터 */}
              <Select
                label="서비스"
                placeholder="모든 서비스"
                value={dataFilters.serviceFilter || ""}
                onSelectionChange={(key) => updateDataFilters({ 
                  serviceFilter: key as string === "" ? undefined : key as string 
                })}
                size="sm"
                className="w-48"
              >
                <SelectItem key="" >모든 서비스</SelectItem>

                {services.map(service => (
                  <SelectItem key={service} >{service}</SelectItem>
                )) as any}
              </Select>
              
              {/* 상태 필터 */}
              <Select
                label="상태"
                placeholder="모든 상태"
                value={dataFilters.statusFilter || ""}
                onSelectionChange={(key) => updateDataFilters({ 
                  statusFilter: key as string === "" ? undefined : key as string 
                })}
                size="sm"
                className="w-32"
              >
                <SelectItem key="" >모든 상태</SelectItem>
                <SelectItem key="OK" >성공</SelectItem>
                <SelectItem key="ERROR">오류</SelectItem>
              </Select>
              
              {/* 필터 초기화 */}
              <Button
                size="sm"
                variant="ghost"
                onPress={() => updateDataFilters({
                  minDuration: undefined,
                  maxDuration: undefined,
                  serviceFilter: undefined,
                  statusFilter: undefined
                })}
              >
                필터 초기화
              </Button>
            </div>
          </div>
        </div>
      )}

      <CardBody className="p-4">
        {/* 차트 요약 정보 */}
        {traceData.length > 0 && !isLoading && !isRefreshing && (
          <div className="mb-4 flex flex-wrap gap-4">
            <div className="flex items-center">
              <Clock size={16} className="mr-1 text-blue-500" />
              <span className="text-sm">평균: {formatDuration(latencyStats.avg)}</span>
            </div>
            <div className="flex items-center">
              <BarChart2 size={16} className="mr-1 text-blue-500" />
              <span className="text-sm">P90: {formatDuration(latencyStats.p90)}</span>
            </div>
            <div className="flex items-center">
              <AlertTriangle size={16} className="mr-1 text-orange-500" />
              <span className="text-sm">
                고지연: {traceData.filter(t => t.duration > (config.latencyThreshold || 300)).length}개
              </span>
            </div>
            <div className="flex items-center">
              <CheckCircle size={16} className="mr-1 text-green-500" />
              <span className="text-sm">
                성공: {traceData.filter(t => t.status === 'OK').length}개
              </span>
            </div>
            <div className="flex items-center">
              <AlertTriangle size={16} className="mr-1 text-red-500" />
              <span className="text-sm">
                오류: {traceData.filter(t => t.status === 'ERROR').length}개
              </span>
            </div>
          </div>
        )}

        {filteredData.length === 0 && !isLoading && !isRefreshing ? (
          <div className="flex items-center justify-center h-96 text-gray-500">
            <p>
              {traceData.length > 0 
                ? '필터 조건에 맞는 데이터가 없습니다.' 
                : '데이터가 로드되지 않았습니다. 데이터가 수신되면 여기에 표시됩니다.'}
            </p>
          </div>
        ) : (isLoading || isRefreshing) ? (
          <div className="flex items-center justify-center h-96 text-gray-500">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <p className="mt-4">데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <div
            ref={chartRef}
            style={{
              width: "100%",
              height: typeof chartHeight === "number" ? `${chartHeight}px` : chartHeight,
            }}
          />
        )}
        
        {/* 데이터 요약 */}
        {filteredData.length > 0 && !isLoading && !isRefreshing && (
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex flex-wrap justify-between gap-2">
              <span>표시된 트레이스: {filteredData.length}개</span>
              {dataFilters.serviceFilter && (
                <Badge className="bg-blue-100 text-blue-800">
                  서비스: {dataFilters.serviceFilter}
                </Badge>
              )}
              {dataFilters.statusFilter && (
                <Badge className={dataFilters.statusFilter === 'ERROR' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                  상태: {dataFilters.statusFilter}
                </Badge>
              )}
              {(dataFilters.minDuration !== undefined || dataFilters.maxDuration !== undefined) && (
                <Badge className="bg-gray-100 text-gray-800">
                  지연 시간: {dataFilters.minDuration !== undefined ? formatDuration(dataFilters.minDuration) : '0ms'} ~ 
                  {dataFilters.maxDuration !== undefined ? formatDuration(dataFilters.maxDuration) : '무제한'}
                </Badge>
              )}
              {(dataFilters.serviceFilter || dataFilters.statusFilter || 
                dataFilters.minDuration !== undefined || dataFilters.maxDuration !== undefined) && (
                <span className="text-xs text-blue-600 cursor-pointer" onClick={() => updateDataFilters({
                  minDuration: undefined,
                  maxDuration: undefined,
                  serviceFilter: undefined,
                  statusFilter: undefined
                })}>
                  필터 초기화
                </span>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
