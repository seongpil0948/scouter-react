'use client';

import React, { useEffect, useState } from 'react';
import { useChartRenderer } from './hook/useChartRenderer';
import { ExtendedTraceChartProps } from './types';

const TraceChart: React.FC<ExtendedTraceChartProps> = React.memo(
  ({ data, height = 700, config, onDataPointClick, onBrushSelected, loading = false, legendState, serviceThresholds }) => {
    const [ready, setReady] = useState(false);

    // Use our custom chart renderer hook with explicit brush config
    const { chartContainerRef, chartHeight, isLoading, isReady } = useChartRenderer({
      data,
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
      },
      legendState,
      onDataPointClick,
      onBrushSelected,
      serviceThresholds,
    });

    // Fade in chart when ready
    useEffect(() => {
      if (isReady) {
        const timer = setTimeout(() => {
          setReady(true);
        }, 100);

        return () => clearTimeout(timer);
      }
    }, [isReady]);

    // Container styles
    const containerStyle: React.CSSProperties = {
      width: '100%',
      height: typeof height === 'number' ? `${height}px` : height,
      opacity: ready ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out',
      position: 'relative',
    };

    // 브러시 사용 안내 메시지
    const renderBrushHelp = () => {
      if (!config.brush?.enabled) return null;

      return (
        <div
          className="absolute top-10 right-5 bg-white dark:bg-gray-800 p-3 rounded-md text-xs text-gray-600 dark:text-gray-300 
                      shadow-sm border border-gray-200 dark:border-gray-700 z-10 max-w-xs"
        >
          <p className="font-medium mb-1">트레이스 선택 방법</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>
              툴박스에서 <span className="font-semibold">사각형 선택</span> 아이콘을 클릭하세요
            </li>
            <li>차트 영역에서 마우스로 드래그하여 데이터 포인트를 선택하세요</li>
            <li>선택된 트레이스가 아래 표에 표시됩니다</li>
          </ol>
          <div className="flex items-center mt-2 bg-blue-50 dark:bg-blue-900/30 p-1 rounded">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <p className="text-blue-700 dark:text-blue-300">여러 영역을 선택하려면 Shift 키를 누른 상태에서 드래그하세요</p>
          </div>
        </div>
      );
    };

    return (
      <div className="relative w-full" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        {/* 브러시 도움말 */}
        {renderBrushHelp()}

        {/* Loading Overlay */}
        {(loading || isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 dark:bg-gray-800 dark:bg-opacity-70 z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <p className="mt-4">데이터를 불러오는 중...</p>
            </div>
          </div>
        )}

        {/* Chart Container */}
        <div ref={chartContainerRef} style={containerStyle} className="brush-enabled-chart" data-testid="trace-chart" />
      </div>
    );
  }
);

TraceChart.displayName = 'TraceChart';

export default TraceChart;
