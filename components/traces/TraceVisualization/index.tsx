'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Badge } from '@heroui/badge';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';
import { Filter, Clock, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';

import TraceChart from './TraceChart';
import SelectedTracesTable from './SelectedTracesTable';
import { useChartStore } from '@/lib/store/chartStore';
import { formatDuration } from '@/lib/utils/dateFormatter';
import { buildServiceThresholds, calculateServiceStats, calculateLatencyStats, processTraceData } from './utils';
import { DEFAULT_FILTER } from './constant';
import { SharedSelection } from '@heroui/system';
import { isEmpty } from 'lodash-es';
import { SelectedTraceData } from './types';

const TraceVisualization: React.FC<TraceVisualizationProps> = ({
  traceData,
  config = {},
  title,
  showFilters = false,
  serviceThresholds: propServiceThresholds,
  onFilterChange,
  onTraceSelect,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTraces, setSelectedTraces] = useState<SelectedTraceData[]>([]);
  const { legendState, dataFilters, updateDataFilters } = useChartStore();

  const serviceThresholds = useMemo(() => buildServiceThresholds(traceData, propServiceThresholds), [traceData, propServiceThresholds]);

  // 필터링은 이제 백엔드에서 처리되므로 filteredData는 바로 traceData 사용
  const filteredData = traceData;

  // Extract unique services for filtering
  const services = useMemo(() => {
    const serviceSet = new Set<string>();
    traceData.forEach((trace) => {
      if (trace.serviceName) {
        serviceSet.add(trace.serviceName);
      }
    });
    return Array.from(serviceSet).sort();
  }, [traceData]);

  const serviceStats = useMemo(() => calculateServiceStats(filteredData, serviceThresholds), [filteredData, serviceThresholds]);

  const latencyStats = useMemo(() => calculateLatencyStats(filteredData), [filteredData]);

  const chartData = useMemo(() => {
    setIsProcessing(true);
    const result = processTraceData(filteredData, config.latencyThreshold, serviceThresholds);
    setIsProcessing(false);
    return result;
  }, [filteredData, config.latencyThreshold, serviceThresholds]);

  // 브러시 선택 핸들러
  const handleBrushSelected = useCallback((selectedData: SelectedTraceData[]) => {
    setSelectedTraces(selectedData);
  }, []);

  // 선택 초기화 핸들러
  const handleClearSelection = useCallback(() => {
    setSelectedTraces([]);
  }, []);

  // 트레이스 상세 보기 핸들러
  const handleViewTraceDetails = useCallback(
    (traceId: string) => {
      if (onTraceSelect) {
        onTraceSelect(traceId);
      }
    },
    [onTraceSelect]
  );

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    const resetFilters = DEFAULT_FILTER;
    updateDataFilters(resetFilters);

    // 상위 컴포넌트에 필터 변경 알림
    if (onFilterChange) {
      onFilterChange(resetFilters);
    }
  }, [updateDataFilters, onFilterChange]);

  const getSelectedServiceKeys = useCallback(() => {
    return dataFilters.serviceFilter === 'all' ? new Set<Key>([]) : dataFilters.serviceFilter;
  }, [dataFilters.serviceFilter]);

  const getSelectedStatusKeys = useCallback(() => {
    return dataFilters.statusFilter === 'all' ? new Set<Key>([]) : dataFilters.statusFilter;
  }, [dataFilters.statusFilter]);

  const handleServiceSelectionChange = useCallback(
    (keys: SharedSelection) => {
      const serviceFilter = isEmpty(keys) ? 'all' : keys;
      const newFilters = { ...dataFilters, serviceFilter };
      updateDataFilters({ serviceFilter });

      // 상위 컴포넌트에 필터 변경 알림
      if (onFilterChange) {
        onFilterChange(newFilters);
      }
    },
    [dataFilters, updateDataFilters, onFilterChange]
  );

  const handleStatusSelectionChange = useCallback(
    (keys: SharedSelection) => {
      const statusFilter = isEmpty(keys) ? 'all' : keys;
      const newFilters = { ...dataFilters, statusFilter };
      updateDataFilters({ statusFilter });

      // 상위 컴포넌트에 필터 변경 알림
      if (onFilterChange) {
        onFilterChange(newFilters);
      }
    },
    [dataFilters, updateDataFilters, onFilterChange]
  );

  // Calculate display values
  const errorCount = filteredData.filter((t) => t.status === 'ERROR').length;
  const successCount = filteredData.filter((t) => t.status === 'OK').length;
  const highLatencyCount = chartData.highLatencyData.length;
  const hasFilters =
    dataFilters.serviceFilter !== 'all' ||
    dataFilters.statusFilter !== 'all' ||
    dataFilters.minDuration !== undefined ||
    dataFilters.maxDuration !== undefined;

  const isLoading = isProcessing;

  return (
    <div className="space-y-4">
      <Card className="w-full">
        {showFilters && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b">
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
                  selectedKeys={getSelectedServiceKeys()}
                  selectionMode="multiple"
                  onSelectionChange={handleServiceSelectionChange}
                  size="sm"
                  className="w-48"
                >
                  {services.map((service) => (
                    <SelectItem key={service} textValue={service}>
                      {service}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="상태"
                  placeholder="모든 상태"
                  selectionMode="multiple"
                  selectedKeys={getSelectedStatusKeys()}
                  onSelectionChange={handleStatusSelectionChange}
                  size="sm"
                  className="w-32"
                >
                  <SelectItem key="OK" textValue="성공">
                    성공
                  </SelectItem>
                  <SelectItem key="ERROR" textValue="오류">
                    오류
                  </SelectItem>
                </Select>

                {/* Reset Filters Button */}
                {hasFilters && (
                  <Button size="sm" variant="ghost" onPress={handleResetFilters}>
                    필터 초기화
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <CardBody className="p-4">
          {/* Stats Summary - Shown when data is available */}
          {filteredData.length > 0 && !isLoading && (
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
                <span className="text-sm">고지연: {highLatencyCount}개</span>
              </div>
              <div className="flex items-center">
                <CheckCircle size={16} className="mr-1 text-green-500" />
                <span className="text-sm">성공: {successCount}개</span>
              </div>
              <div className="flex items-center">
                <AlertTriangle size={16} className="mr-1 text-red-500" />
                <span className="text-sm">오류: {errorCount}개</span>
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
                  const tooltip = stats ? `총 ${stats.total}개 중 ${stats.exceeded}개 초과` : '데이터 없음';

                  return (
                    <Badge key={service} className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" title={tooltip}>
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
            height={config.height}
            config={config}
            onBrushSelected={handleBrushSelected}
            loading={isLoading}
            legendState={legendState}
            serviceThresholds={serviceThresholds}
          />

          {/* No Data Message */}
          {filteredData.length === 0 && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <p>
                {hasFilters ? '필터 조건에 맞는 데이터가 없습니다.' : '데이터가 로드되지 않았습니다. 데이터가 수신되면 여기에 표시됩니다.'}
              </p>
            </div>
          )}

          {filteredData.length > 0 && !isLoading && (
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex flex-wrap justify-between gap-2">
                <span>표시된 트레이스: {filteredData.length}개</span>

                {dataFilters.serviceFilter !== 'all' && (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                    서비스: {Array.from(dataFilters.serviceFilter).join(', ')}
                  </Badge>
                )}

                {dataFilters.statusFilter !== 'all' && (
                  <Badge
                    className={
                      dataFilters.statusFilter.has('ERROR')
                        ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                    }
                  >
                    상태: {Array.from(dataFilters.statusFilter).join(', ')}
                  </Badge>
                )}

                {(dataFilters.minDuration !== undefined || dataFilters.maxDuration !== undefined) && (
                  <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    지연 시간: {dataFilters.minDuration !== undefined ? formatDuration(dataFilters.minDuration) : '0ms'} ~
                    {dataFilters.maxDuration !== undefined ? formatDuration(dataFilters.maxDuration) : '무제한'}
                  </Badge>
                )}

                {/* Reset Filters Link */}
                {hasFilters && (
                  <span className="text-xs text-blue-600 cursor-pointer dark:text-blue-400" onClick={handleResetFilters}>
                    필터 초기화
                  </span>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 선택된 트레이스 테이블 */}
      {selectedTraces.length > 0 && (
        <SelectedTracesTable selectedTraces={selectedTraces} onClearSelection={handleClearSelection} onViewDetails={onTraceSelect} />
      )}
    </div>
  );
};

TraceVisualization.displayName = 'TraceVisualization';

export default TraceVisualization;
