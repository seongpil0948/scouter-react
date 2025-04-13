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

    return (
      <div className="relative w-full" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
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
