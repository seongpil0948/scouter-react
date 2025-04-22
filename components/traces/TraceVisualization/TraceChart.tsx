"use client";

import React, { useEffect, useState } from "react";
import { useChartRenderer } from "./hook/useChartRenderer";
import { useIsSSR } from "@react-aria/ssr";

const TraceChart: React.FC<ExtendedTraceChartProps> = ({
  data,
  height = 700,
  config,
  onDataPointClick,
  onBrushSelected,
  loading = false,
  legendState,
  serviceThresholds,
}) => {
  const [ready, setReady] = useState(false);
  const isSSR = useIsSSR();

  const { chartContainerRef, isLoading, isReady } = useChartRenderer({
    data,
    config: {
      ...config,
      brush: {
        enabled: true,
        type: "rect",
        mode: "multiple",
        throttleType: "debounce",
        throttleDelay: 300,
        ...config.brush,
      },
      realtimeRange: config.realtimeRange || 5,
    },
    legendState,
    onDataPointClick,
    onBrushSelected,
    serviceThresholds: serviceThresholds ?? ({} as any),
  });

  useEffect(() => {
    if (isReady && !isSSR) {
      setTimeout(() => setReady(true), 100);
    }
  }, [isReady, isSSR]);

  if (isSSR) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-sm">
        <div className="animate-pulse text-gray-400">차트 로딩 중...</div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full"
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      {(loading || isLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 dark:bg-gray-800 dark:bg-opacity-70 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      <div
        ref={chartContainerRef}
        className="w-full h-full transition-opacity duration-300"
        style={{ opacity: ready ? 1 : 0 }}
        data-testid="trace-chart"
      />
    </div>
  );
};

export default React.memo(TraceChart);
