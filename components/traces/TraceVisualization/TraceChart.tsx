'use client';

import React, { useEffect, useState } from 'react';
import { useChartRenderer } from './hook/useChartRenderer';
import { ExtendedTraceChartProps } from './types';
import { useIsSSR } from '@react-aria/ssr';

const TraceChart: React.FC<ExtendedTraceChartProps> = React.memo(
  ({ data, height = 700, config, onDataPointClick, onBrushSelected, loading = false, legendState, serviceThresholds }) => {
    const [ready, setReady] = useState(false);
    const isSSR = useIsSSR();

    // 데이터 유효성 검사 - 서버/클라이언트 불일치 방지
    const validData = React.useMemo(() => {
      // SSR에서는 빈 데이터 반환하여 하이드레이션 이슈 방지
      if (isSSR) {
        return {
          timeSeriesData: [],
          highLatencyData: [],
          metadataMap: new Map(),
        };
      }

      // 클라이언트에서는 데이터 유효성 검사 후 반환
      return {
        timeSeriesData: Array.isArray(data.timeSeriesData) ? data.timeSeriesData : [],
        highLatencyData: Array.isArray(data.highLatencyData) ? data.highLatencyData : [],
        metadataMap: data.metadataMap instanceof Map ? data.metadataMap : new Map(),
      };
    }, [data, isSSR]);

    // Use our custom chart renderer hook with explicit brush config
    const {
      chartContainerRef,
      chartHeight,
      isLoading,
      isReady,
      isSSR: rendererIsSSR,
    } = useChartRenderer({
      data: validData,
      config: {
        ...config,
        brush: {
          enabled: true,
          type: 'rect',
          mode: 'multiple',
          throttleType: 'debounce',
          throttleDelay: 300,
          ...config.brush,
        },
        // 실시간 모드 관련 설정 추가
        realtimeRange: config.realtimeRange || 5,
      },
      legendState,
      onDataPointClick,
      onBrushSelected,
      serviceThresholds,
    });

    // Fade in chart when ready
    useEffect(() => {
      if (isReady && !isSSR) {
        const timer = setTimeout(() => {
          setReady(true);
        }, 100);

        return () => clearTimeout(timer);
      }
    }, [isReady, isSSR]);

    // Container styles
    const containerStyle: React.CSSProperties = {
      width: '100%',
      height: typeof height === 'number' ? `${height}px` : height,
      opacity: ready ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out',
      position: 'relative',
    };

    // SSR에서는 로딩 상태만 렌더링
    if (isSSR) {
      return (
        <div className="relative w-full" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
          <div
            className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded"
            aria-label="차트 로딩 중"
            role="status"
          >
            <div className="animate-pulse text-gray-400">차트 로딩 중...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        {(loading || isLoading) && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 dark:bg-gray-800 dark:bg-opacity-70 z-10"
            aria-label="데이터 로딩 중"
            role="status"
          >
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" aria-hidden="true" />
              <p className="mt-4">데이터를 불러오는 중...</p>
            </div>
          </div>
        )}

        {/* Chart Container */}
        <div
          ref={chartContainerRef}
          style={containerStyle}
          className="brush-enabled-chart"
          data-testid="trace-chart"
          role="img"
          aria-label={`트레이스 데이터 차트 ${config.title || ''}`}
        />
      </div>
    );
  }
);

TraceChart.displayName = 'TraceChart';

export default TraceChart;
