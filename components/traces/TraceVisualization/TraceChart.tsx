"use client";

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useTheme } from 'next-themes';
import { DEFAULT_CONFIG } from './constant';
import useECharts from './hook/useEchart';
import { EChartsOption } from 'echarts';

interface TraceChartProps {
  data: {
    timeSeriesData: DataPoint[];
    highLatencyData: DataPoint[];
  };
  height?: number | string;
  config: Partial<ChartConfig>;
  onDataPointClick?: (timestamp: number) => void;
  loading?: boolean;
  legendState: {
    normal: boolean;
    highLatency: boolean;
  };
}

const TraceChart: React.FC<TraceChartProps> = React.memo(({
  data,
  height = 400,
  config,
  onDataPointClick,
  loading = false,
  legendState
}) => {
  const { theme } = useTheme();
  const [ready, setReady] = useState(false);
  
  // 설정 병합
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config]);
  
  // ECharts 훅 사용
  const { 
    chartContainerRef, 
    setOption, 
    on, 
    off,
    isReady 
  } = useECharts({
    theme: theme === 'dark' ? 'dark' : undefined
  });
  
  // 차트 설정 생성
  const getChartOptions = useCallback(() => {
    const {
      title: chartTitle,
      colors,
      symbolSizes,
      latencyThreshold
    } = mergedConfig;
    
    return {
      animation: true,
      title: {
        text: chartTitle,
        left: "center",
        textStyle: theme === "dark" ? { color: "#fff" } : undefined,
      },
      legend: {
        data: ["일반 요청", "고지연 요청"],
        right: 10,
        top: 10,
        selected: {
          "일반 요청": legendState.normal,
          "고지연 요청": legendState.highLatency,
        },
      },
      tooltip: {
        show: true,
        trigger: "item",
        backgroundColor: theme === "dark" ? "rgba(50,50,50,0.9)" : "rgba(255,255,255,0.9)",
        borderColor: theme === "dark" ? "#333" : "#ccc",
        textStyle: { color: theme === "dark" ? "#fff" : "#333" },
        extraCssText: "box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);",
        formatter: function (params: any) {
          if (!params.value || params.value.length < 2) {
            return "데이터 없음";
          }

          const timestamp = params.value[0];
          const latency = params.value[1];
          const date = new Date(timestamp);
          const thresholdValue = latencyThreshold || DEFAULT_CONFIG.latencyThreshold!;
          const criticalColor = colors?.critical || DEFAULT_CONFIG.colors?.critical;
          const mediumColor = colors?.medium || DEFAULT_CONFIG.colors?.medium;

          return `
            <div style="font-weight: bold; margin-bottom: 5px;">
              ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>지연 시간:</span>
              <span style="font-weight: bold; color: ${latency > thresholdValue ? criticalColor : mediumColor}">
                ${latency.toFixed(2)}ms
              </span>
            </div>
          `;
        }
      },
      toolbox: {
        show: true,
        feature: {
          dataZoom: {
            yAxisIndex: "none",
          },
          restore: {},
          saveAsImage: {},
        },
        right: 10,
        iconStyle: {
          borderColor: theme === "dark" ? "#666" : "#666",
          color: theme === "dark" ? "#ddd" : "#333",
        },
      },
      dataZoom: [
        {
          type: "inside",
          start: 0,
          end: 100,
          zoomLock: false,
          filterMode: "filter",
        },
        {
          start: 0,
          end: 100,
          bottom: 10,
          height: 20,
          borderColor: theme === "dark" ? "#444" : "#ddd",
          textStyle: {
            color: theme === "dark" ? "#fff" : undefined,
          },
          fillerColor: theme === "dark" ? "rgba(80,80,80,0.3)" : "rgba(200,200,200,0.3)",
          filterMode: "filter",
        },
      ],
      xAxis: {
        type: "time" as const,
        boundaryGap: false,
        name: "시간",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: {
          color: theme === "dark" ? "#fff" : undefined,
        },
        scale: true,
        axisLabel: {
          formatter: (value: number) => new Date(value).toLocaleTimeString(),
          show: true,
          color: theme === "dark" ? "#ccc" : undefined,
        },
        axisLine: {
          lineStyle: {
            color: theme === "dark" ? "#444" : "#ccc",
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            opacity: theme === "dark" ? 0.2 : 0.3,
            color: theme === "dark" ? "#444" : "#ddd",
          },
        },
      },
      yAxis: {
        type: "value" as const,
        name: "지연 시간 (ms)",
        nameLocation: "middle",
        nameGap: 40,
        nameTextStyle: {
          color: theme === "dark" ? "#fff" : undefined,
        },
        min: 0,
        scale: true,
        axisLabel: {
          show: true,
          color: theme === "dark" ? "#ccc" : undefined,
        },
        axisLine: {
          lineStyle: {
            color: theme === "dark" ? "#444" : "#ccc",
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            opacity: theme === "dark" ? 0.2 : 0.3,
            color: theme === "dark" ? "#444" : "#ddd",
          },
        },
      },
      grid: {
        left: "5%",
        right: "5%",
        bottom: "15%",
        top: "15%",
        containLabel: true,
      },
      series: [
        {
          name: "일반 요청",
          type: "scatter",
          large: true,
          largeThreshold: 100,
          progressive: 400,
          progressiveThreshold: 1000,
          progressiveRepaint: true,
          symbol: "circle",
          symbolSize: (value: number[]) => {
            if (!value || value.length < 2) return symbolSizes?.min || 8;
            const latency = value[1];
            const minSize = symbolSizes?.min || 8;
            const maxSize = symbolSizes?.max || 18;

            return minSize + Math.min(latency / 50, maxSize - minSize);
          },
          itemStyle: {
            color: (params: any) => {
              if (!params.value || params.value.length < 2)
                return colors?.medium || DEFAULT_CONFIG.colors?.medium;
              const latency = params.value[1];
              const lowColor = colors?.low || DEFAULT_CONFIG.colors?.low;
              const mediumColor = colors?.medium || DEFAULT_CONFIG.colors?.medium;
              const highColor = colors?.high || DEFAULT_CONFIG.colors?.high;
              const criticalColor = colors?.critical || DEFAULT_CONFIG.colors?.critical;

              if (latency < 100) return lowColor;
              if (latency < 200) return mediumColor;
              if (latency < 300) return highColor;

              return criticalColor;
            },
            opacity: 0.8,
            shadowBlur: 5,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              borderWidth: 2,
            },
          },
          data: legendState.normal ? data.timeSeriesData : [],
        },
        {
          name: "고지연 요청",
          type: "effectScatter",
          symbol: "circle",
          symbolSize: (value: number[]) => {
            if (!value || value.length < 2) return symbolSizes?.effectMin || 15;
            const latency = value[1];
            const minSize = symbolSizes?.effectMin || 15;
            const maxSize = symbolSizes?.effectMax || 30;

            return minSize + Math.min(latency / 50, maxSize - minSize);
          },
          showEffectOn: "render",
          rippleEffect: {
            brushType: "stroke",
            scale: 3,
            period: 3,
          },
          itemStyle: {
            color: colors?.effectScatter || DEFAULT_CONFIG.colors?.effectScatter,
            shadowBlur: 10,
            shadowColor: "rgba(255, 77, 79, 0.5)",
          },
          emphasis: {
            scale: true,
          },
          data: legendState.highLatency ? data.highLatencyData : [],
        },
      ],
    } as EChartsOption;
  }, [mergedConfig, theme, data, legendState]);
  
  // 차트 옵션 업데이트
  useEffect(() => {
    if (isReady && (data.timeSeriesData.length > 0 || data.highLatencyData.length > 0)) {
      // 약간의 지연을 두고 옵션 설정
      const timer = setTimeout(() => {
        setOption(getChartOptions() );
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isReady, data, getChartOptions, setOption]);
  
  // 클릭 이벤트 핸들러
  useEffect(() => {
    if (!isReady || !onDataPointClick) return;
    
    const handleClick = (params: any) => {
      if (params && params.value && Array.isArray(params.value) && params.value.length > 0) {
        const timestamp = params.value[0] as number;
        onDataPointClick(timestamp);
      }
    };
    
    // 클릭 이벤트 리스너 등록
    on('click', handleClick);
    
    // 클린업
    return () => {
      off('click', handleClick);
    };
  }, [isReady, onDataPointClick, on, off]);
  
  // 컴포넌트 초기 표시를 위한 준비 상태 설정
  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        setReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isReady]);
  
  // 차트 컨테이너 스타일
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: typeof height === 'number' ? `${height}px` : height,
    opacity: ready ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
    position: 'relative'
  };
  
  return (
    <div className="relative w-full" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      {/* 로딩 오버레이 */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <p className="mt-4">데이터를 불러오는 중...</p>
          </div>
        </div>
      )}
      
      {/* 차트 컨테이너 */}
      <div ref={chartContainerRef} style={containerStyle} />
    </div>
  );
});

TraceChart.displayName = 'TraceChart';

export default TraceChart;