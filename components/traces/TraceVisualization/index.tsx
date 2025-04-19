'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { useIsSSR } from '@react-aria/ssr';

import TraceChart from './TraceChart';
import SelectedTracesTable from './SelectedTracesTable';
import StatsSummary from './StatsSummary';
import FilterControls from './FilterControls';
import ThresholdDisplay from './ThresholdDisplay';
import NoData from './NoData';
import FilterSummary from './FilterSummary';

import { useChartStore } from '@/lib/store/chartStore';
import { buildServiceThresholds, calculateServiceStats, calculateLatencyStats, processTraceData } from './utils';
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
  const isSSR = useIsSSR();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTraces, setSelectedTraces] = useState<SelectedTraceData[]>([]);
  const { legendState, dataFilters, updateDataFilters } = useChartStore();

  // SSR 환경에서는 빈 배열을 사용하여 하이드레이션 이슈 방지
  const safeTraceData = useMemo(() => {
    return isSSR ? [] : Array.isArray(traceData) ? traceData : [];
  }, [traceData, isSSR]);

  // 서비스 임계값 계산
  const serviceThresholds = useMemo(
    () => buildServiceThresholds(safeTraceData, propServiceThresholds),
    [safeTraceData, propServiceThresholds]
  );

  // 필터링은 이제 백엔드에서 처리되므로 filteredData는 바로 safeTraceData 사용
  const filteredData = safeTraceData;

  // Extract unique services for filtering
  const services = useMemo(() => {
    if (isSSR) return [];

    const serviceSet = new Set<string>();
    safeTraceData.forEach((trace) => {
      if (trace.serviceName) {
        serviceSet.add(trace.serviceName);
      }
    });
    return Array.from(serviceSet).sort();
  }, [safeTraceData, isSSR]);

  // 서비스 통계 계산
  const serviceStats = useMemo(
    () => (isSSR ? new Map() : calculateServiceStats(filteredData, serviceThresholds)),
    [filteredData, serviceThresholds, isSSR]
  );

  // 지연시간 통계 계산
  const latencyStats = useMemo(
    () => (isSSR ? { min: 0, max: 0, avg: 0, p90: 0, p95: 0, p99: 0 } : calculateLatencyStats(filteredData)),
    [filteredData, isSSR]
  );

  // 차트 데이터 처리
  const chartData = useMemo(() => {
    if (isSSR) {
      return {
        timeSeriesData: [],
        highLatencyData: [],
        metadataMap: new Map(),
      };
    }

    setIsProcessing(true);
    const result = processTraceData(filteredData, config.latencyThreshold, serviceThresholds);
    setIsProcessing(false);
    return result;
  }, [filteredData, config.latencyThreshold, serviceThresholds, isSSR]);

  // 브러시 선택 핸들러
  const handleBrushSelected = useCallback(
    (selectedData: SelectedTraceData[]) => {
      if (isSSR) return;

      // 선택된 항목이 있을 때만 상태 업데이트
      if (selectedData.length > 0) {
        setSelectedTraces(selectedData);
      }
    },
    [isSSR]
  );

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

  // 계산된 값들
  const errorCount = filteredData.filter((t) => t.status === 'ERROR').length;
  const successCount = filteredData.filter((t) => t.status === 'OK').length;
  const highLatencyCount = chartData.highLatencyData.length;
  const hasFilters =
    dataFilters.serviceFilter !== 'all' ||
    dataFilters.statusFilter !== 'all' ||
    dataFilters.minDuration !== undefined ||
    dataFilters.maxDuration !== undefined;

  const isLoading = isProcessing;

  // 실시간 모드 감지
  const isRealtime = useMemo(() => config.autoUpdate === true, [config.autoUpdate]);

  return (
    <div className="space-y-4">
      <Card className="w-full">
        {/* 필터 컨트롤 */}
        {showFilters && (
          <FilterControls
            services={services}
            dataFilters={dataFilters}
            updateDataFilters={updateDataFilters}
            onFilterChange={onFilterChange}
            hasFilters={hasFilters}
          />
        )}

        <CardBody className="p-4">
          {/* 통계 요약 - 데이터가 있을 때만 표시 */}
          {filteredData.length > 0 && !isLoading && (
            <StatsSummary
              latencyStats={latencyStats}
              highLatencyCount={highLatencyCount}
              successCount={successCount}
              errorCount={errorCount}
              selectedTracesCount={selectedTraces.length}
              onClearSelection={handleClearSelection}
            />
          )}

          {/* 서비스별 임계값 표시 - 필터가 활성화된 경우에만 표시 */}
          {showFilters && filteredData.length > 0 && (
            <ThresholdDisplay
              serviceThresholds={serviceThresholds}
              serviceStats={serviceStats}
            />
          )}

          {/* 차트 컴포넌트 */}
          <TraceChart
            data={chartData}
            height={config.height}
            config={{
              ...config,
              brush: {
                enabled: true,
                type: 'rect',
                mode: 'multiple',
                throttleType: 'debounce',
                throttleDelay: 300,
                ...config.brush,
              },
              realtimeRange: config.realtimeRange || 5,
            }}
            onBrushSelected={handleBrushSelected}
            loading={isLoading}
            legendState={legendState}
            serviceThresholds={serviceThresholds}
          />

          {/* 데이터 없음 메시지 */}
          {filteredData.length === 0 && !isLoading && (
            <NoData 
              isRealtime={isRealtime} 
              hasFilters={hasFilters} 
            />
          )}

          {/* 필터 요약 */}
          {filteredData.length > 0 && !isLoading && (
            <FilterSummary
              filteredDataLength={filteredData.length}
              dataFilters={dataFilters}
              hasFilters={hasFilters}
              onResetFilters={() => updateDataFilters(DEFAULT_FILTER)}
            />
          )}
        </CardBody>
      </Card>

      {/* 선택된 트레이스 테이블 */}
      {selectedTraces.length > 0 && (
        <SelectedTracesTable
          selectedTraces={selectedTraces}
          onClearSelection={handleClearSelection}
          onViewDetails={onTraceSelect}
        />
      )}
    </div>
  );
};

TraceVisualization.displayName = 'TraceVisualization';

export default TraceVisualization;
