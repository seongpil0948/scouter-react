// components/traces/TraceVisualization/index.tsx
"use client";

import React, { useMemo, useCallback, useState } from "react";
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

import TraceChart from './TraceChart';

import { useChartStore } from '@/lib/store/chartStore';
import { formatDuration } from '@/lib/utils/dateFormatter';
import { DEFAULT_CHART_CONFIG, buildServiceThresholds, filterTraceData, calculateServiceStats, calculateLatencyStats, processTraceData, findTraceByTimestamp } from './utils';

const TraceVisualization: React.FC<TraceVisualizationProps> = ({
  traceData,
  onDataPointClick,
  config = {},
  onRefresh,
  title,
  showFilters = false,
  serviceThresholds: propServiceThresholds,
}) => {
  // Local state
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Store state
  const { 
    isRefreshing,
    setRefreshing,
    legendState,
    toggleLegend,
    dataFilters,
    updateDataFilters
  } = useChartStore();

  // Merge configuration with defaults
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CHART_CONFIG,
    ...config,
  }), [config]);

  // Service thresholds - either from props or auto-calculated
  const serviceThresholds = useMemo(() => 
    buildServiceThresholds(traceData, propServiceThresholds),
  [traceData, propServiceThresholds]);

  // Apply filters to trace data
  const filteredData = useMemo(() => 
    filterTraceData(traceData, dataFilters),
  [traceData, dataFilters]);

  // Extract unique services for filtering
  const services = useMemo(() => {
    const serviceSet = new Set<string>();
    traceData.forEach(trace => {
      if (trace.serviceName) {
        serviceSet.add(trace.serviceName);
      }
    });
    return Array.from(serviceSet).sort();
  }, [traceData]);

  // Calculate service statistics
  const serviceStats = useMemo(() => 
    calculateServiceStats(filteredData, serviceThresholds),
  [filteredData, serviceThresholds]);

  // Calculate latency statistics
  const latencyStats = useMemo(() => 
    calculateLatencyStats(filteredData),
  [filteredData]);

  // Process data for chart visualization
  const chartData = useMemo(() => {
    setIsProcessing(true);
    
    const result = processTraceData(
      filteredData, 
      mergedConfig.latencyThreshold,
      mergedConfig.maxDataPoints,
      serviceThresholds
    );
    
    setIsProcessing(false);
    return result;
  }, [
    filteredData, 
    mergedConfig.latencyThreshold, 
    mergedConfig.maxDataPoints, 
    serviceThresholds
  ]);

  // Handle data point click
  const handleDataPointClick = useCallback((timestamp: number) => {
    const trace = findTraceByTimestamp(traceData, timestamp);
    if (trace && onDataPointClick) {
      onDataPointClick(trace);
    }
  }, [traceData, onDataPointClick]);

  // Handle refresh button click
  const handleRefresh = useCallback(async () => {
    if (onRefresh && !isRefreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Chart refresh error:', error);
      } finally {
        // UI feedback delay
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  }, [onRefresh, isRefreshing, setRefreshing]);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    updateDataFilters({
      minDuration: undefined,
      maxDuration: undefined,
      serviceFilter: undefined,
      statusFilter: undefined
    });
  }, [updateDataFilters]);

  // Service filter change handler
  const handleServiceFilterChange = useCallback((key: React.Key) => {
    updateDataFilters({ 
      serviceFilter: key as string === "" ? undefined : key as string 
    });
  }, [updateDataFilters]);

  // Status filter change handler
  const handleStatusFilterChange = useCallback((key: React.Key) => {
    updateDataFilters({ 
      statusFilter: key as string === "" ? undefined : key as string 
    });
  }, [updateDataFilters]);

  // Calculate display values
  const errorCount = filteredData.filter(t => t.status === 'ERROR').length;
  const successCount = filteredData.filter(t => t.status === 'OK').length;
  const highLatencyCount = chartData.highLatencyData.length;
  const hasFilters = dataFilters.serviceFilter || 
                    dataFilters.statusFilter || 
                    dataFilters.minDuration !== undefined || 
                    dataFilters.maxDuration !== undefined;

  return (
    <Card className="w-full">
      {/* Header Section */}
      <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-lg font-medium">
          {title || mergedConfig.title || '트레이스 시각화'}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {/* Legend Toggles */}
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
          
          {/* Refresh Button */}
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

      {/* Filters Section - Conditionally Rendered */}
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-1">
              <Filter size={16} />
              <span className="text-sm font-medium">필터:</span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Service Filter */}
              <Select
                label="서비스"
                placeholder="모든 서비스"
                value={dataFilters.serviceFilter || ""}
                onSelectionChange={handleServiceFilterChange as any}
                size="sm"
                className="w-48"
              >
                <SelectItem key="" >모든 서비스</SelectItem>
                {services.map(service => (
                  <SelectItem key={service} >{service}</SelectItem>
                )) as any}
              </Select>
              
              {/* Status Filter */}
              <Select
                label="상태"
                placeholder="모든 상태"
                value={dataFilters.statusFilter || ""}
                onSelectionChange={handleStatusFilterChange as any}
                size="sm"
                className="w-32"
              >
                <SelectItem key="" >모든 상태</SelectItem>
                <SelectItem key="OK" >성공</SelectItem>
                <SelectItem key="ERROR">오류</SelectItem>
              </Select>
              
              {/* Reset Filters Button */}
              <Button
                size="sm"
                variant="ghost"
                onPress={handleResetFilters}
              >
                필터 초기화
              </Button>
            </div>
          </div>
        </div>
      )}

      <CardBody className="p-4">
        {/* Stats Summary - Shown when data is available */}
        {filteredData.length > 0 && !isRefreshing && (
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
                고지연: {highLatencyCount}개
              </span>
            </div>
            <div className="flex items-center">
              <CheckCircle size={16} className="mr-1 text-green-500" />
              <span className="text-sm">
                성공: {successCount}개
              </span>
            </div>
            <div className="flex items-center">
              <AlertTriangle size={16} className="mr-1 text-red-500" />
              <span className="text-sm">
                오류: {errorCount}개
              </span>
            </div>
          </div>
        )}

        {/* Service Thresholds - Shown when filters are enabled */}
        {showFilters && filteredData.length > 0 && serviceThresholds.size > 0 && (
          <div className="mb-4 text-xs text-gray-500">
            <div className="flex items-center mb-1">
              <span className="font-medium">서비스별 임계값:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from(serviceThresholds.entries()).map(([service, threshold]) => {
                const stats = serviceStats.get(service);
                const tooltip = stats 
                  ? `총 ${stats.total}개 중 ${stats.exceeded}개 초과`
                  : '데이터 없음';
                
                return (
                  <Badge 
                    key={service} 
                    className="bg-gray-100 text-gray-700"
                    title={tooltip}
                  >
                    {service}: {formatDuration(threshold)}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Chart Component */}
        <TraceChart 
          data={chartData}
          height={mergedConfig.height}
          config={mergedConfig}
          onDataPointClick={handleDataPointClick}
          loading={isRefreshing || isProcessing}
          legendState={legendState}
          serviceThresholds={serviceThresholds}
        />
        
        {/* No Data Message */}
        {filteredData.length === 0 && !isRefreshing && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <p>
              {traceData.length > 0 
                ? '필터 조건에 맞는 데이터가 없습니다.' 
                : '데이터가 로드되지 않았습니다. 데이터가 수신되면 여기에 표시됩니다.'}
            </p>
          </div>
        )}
        
        {/* Data Summary Footer */}
        {filteredData.length > 0 && !isRefreshing && (
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex flex-wrap justify-between gap-2">
              <span>표시된 트레이스: {filteredData.length}개</span>
              
              {/* Active Filters Display */}
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
              
              {/* Reset Filters Link */}
              {hasFilters && (
                <span 
                  className="text-xs text-blue-600 cursor-pointer" 
                  onClick={handleResetFilters}
                >
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

TraceVisualization.displayName = 'TraceVisualization';

export default TraceVisualization;