// hooks/useTraceChart.ts
import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import * as echarts from 'echarts';
import { useTheme } from 'next-themes';
import debounce from 'lodash.debounce';
import { useChartStore, DEFAULT_CHART_CONFIG } from '@/lib/store/chartStore';
import { DEFAULT_CONFIG } from '../constant';

interface UseTraceChartOptions {
  traceData: TraceItem[];
  onDataPointClick: (trace: TraceItem) => void;
  config?: Partial<ChartConfig>;
}

export function useTraceChart({ traceData, onDataPointClick, config = {} }: UseTraceChartOptions) {
  const { theme } = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Zustand 스토어에서 상태 가져오기
  const { 
    config: storeConfig, 
    updateConfig,
    legendState,
    isRefreshing,
    dataFilters
  } = useChartStore();
  
  // 외부 config와 스토어 config 병합
  const mergedConfig = useMemo(() => {
    // 컴포넌트에 전달된 config가 있으면 스토어 업데이트
    if (Object.keys(config).length > 0) {
      updateConfig(config);
    }
    
    return {
      ...DEFAULT_CHART_CONFIG,
      ...storeConfig,
      ...config,
    };
  }, [config, storeConfig, updateConfig]);
  
  const {
    title: chartTitle,
    height: chartHeight,
    maxDataPoints,
    latencyThreshold,
    colors,
    symbolSizes,
  } = mergedConfig;

  // 차트 데이터 상태
  const chartDataRef = useRef<{
    timeSeriesData: DataPoint[];
    highLatencyData: DataPoint[];
  }>({
    timeSeriesData: [],
    highLatencyData: [],
  });
  
  // 범례 상태에 따른 시리즈 표시 설정
  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.setOption({
        series: [
          { 
            name: "일반 요청",
            data: legendState.normal ? chartDataRef.current.timeSeriesData : [] 
          },
          { 
            name: "고지연 요청",
            data: legendState.highLatency ? chartDataRef.current.highLatencyData : [] 
          }
        ]
      });
    }
  }, [legendState]);

  // 차트 테마 설정
  const getTheme = useCallback(() => {
    if (theme === "dark") {
      return {
        backgroundColor: "#141414",
        textStyle: { color: "#ffffff" },
        axisLine: { lineStyle: { color: "#333" } },
        splitLine: { lineStyle: { color: "#333" } },
      };
    }
    return {};
  }, [theme]);

  // 툴팁 설정
  const getTooltip = useCallback(() => ({
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
      const thresholdValue = latencyThreshold!;
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
    },
  }), [theme, latencyThreshold, colors]);

  // 차트 초기 옵션 설정
  const getInitialOption = useCallback(() => {
    const themeOptions = getTheme();
    
    return {
      ...themeOptions,
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
          "일반 요청": true,
          "고지연 요청": true,
        },
      },
      tooltip: getTooltip(),
      toolbox: {
        show: true,
        feature: {
          dataZoom: {
            yAxisIndex: "none",
            icon: {
              zoom: "path://M10.525 5.025a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM.75 12.525a9.75 9.75 0 1119.5 0 9.75 9.75 0 01-19.5 0zm17.53 7.78a.75.75 0 011.06 0l4.5 4.5a.75.75 0 11-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06z",
              back: "path://M11.78 5.22a.75.75 0 0 1 0 1.06l-3.72 3.72h11.19a.75.75 0 0 1 0 1.5H8.06l3.72 3.72a.75.75 0 1 1-1.06 1.06l-5-5a.751.751 0 0 1 0-1.06l5-5a.75.75 0 0 1 1.06 0",
            },
          },
          restore: {
            icon: "path://M4.75 4a.75.75 0 0 1 .75.75v1.5h9V4.75a.75.75 0 0 1 1.5 0v1.5h2.25c.966 0 1.75.784 1.75 1.75v11.5A1.75 1.75 0 0 1 18.25 21H2.75A1.75 1.75 0 0 1 1 19.5V8c0-.966.784-1.75 1.75-1.75H5v-1.5A.75.75 0 0 1 4.75 4m13.5 7V8a.25.25 0 0 0-.25-.25H2.75A.25.25 0 0 0 2.5 8v3h15.75m0 1.5H2.5v8c0 .138.112.25.25.25h15.5a.25.25 0 0 0 .25-.25v-8",
          },
          saveAsImage: {
            icon: "path://M10 1.5a.75.75 0 0 1 .75.75v1h1.5a.75.75 0 0 1 0 1.5h-1.5v1a.75.75 0 0 1-1.5 0v-1h-1.5a.75.75 0 0 1 0-1.5h1.5v-1A.75.75 0 0 1 10 1.5M4 8a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm7-1a4 4 0 1 0 0 8 4 4 0 0 0 0-8m-4 4a4 4 0 1 1 8 0 4 4 0 0 1-8 0",
          },
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
        type: "time",
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
        type: "value",
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
          data: [],
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
          data: [],
        },
      ],
    };
  }, [chartTitle, theme, getTheme, getTooltip, symbolSizes, colors]);

  // 차트 초기화 함수
  const initChart = useCallback(() => {
    if (chartRef.current) {
      // 기존 차트 인스턴스가 있으면 제거
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }

      // 새 차트 인스턴스 생성
      const chartInstance = echarts.init(
        chartRef.current,
        theme === "dark" ? "dark" : undefined,
      );

      chartInstanceRef.current = chartInstance;

      // 초기 옵션 설정
      const option = getInitialOption();
      chartInstance.setOption(option);

      // 클릭 이벤트 핸들러 등록
      chartInstance.on("click", function (params) {
        if (
          params &&
          params.value &&
          Array.isArray(params.value) &&
          params.value.length > 0
        ) {
          const timestamp = params.value[0] as number;

          // 클릭된 지점과 가장 가까운 트레이스 찾기
          const closestTrace = traceData.reduce((closest, trace) => {
            const currentDiff = Math.abs(trace.startTime - timestamp);
            const closestDiff = Math.abs((closest?.startTime || 0) - timestamp);

            return currentDiff < closestDiff ? trace : closest;
          }, traceData[0]);

          if (closestTrace) {
            onDataPointClick(closestTrace);
          }
        }
      });

      return chartInstance;
    }

    return null;
  }, [getInitialOption, traceData, onDataPointClick, theme]);

  // 트레이스 데이터 처리 함수
  const processTraceData = useCallback((traces: TraceItem[]) => {
    if (!chartInstanceRef.current) {
      return false;
    }

    let newData: DataPoint[] = [];
    let newHighLatencyData: DataPoint[] = [];
    let hasNewData = false;

    // 새로운 데이터 처리
    traces.forEach((trace) => {
      // 유효성 검사
      if (!trace) {
        return;
      }

      // 타임스탬프가 문자열인 경우 숫자로 변환
      const timestamp =
        typeof trace.startTime === "string"
          ? parseInt(trace.startTime, 10)
          : trace.startTime;

      if (!timestamp || isNaN(timestamp)) {
        return;
      }

      const latency = trace.duration;

      if (latency === undefined || isNaN(latency)) {
        return;
      }

      const thresholdValue = latencyThreshold || DEFAULT_CONFIG.latencyThreshold!;

      // 데이터 포인트 생성
      const dataPoint: DataPoint = [timestamp, latency];

      newData.push(dataPoint);

      if (latency > thresholdValue) {
        newHighLatencyData.push(dataPoint);
      }

      hasNewData = true;
    });

    if (hasNewData) {
      // 기존 데이터와 병합
      const updatedTimeSeriesData = [
        ...chartDataRef.current.timeSeriesData,
        ...newData,
      ]
        .sort((a, b) => a[0] - b[0])
        .slice(-maxDataPoints!);

      const updatedHighLatencyData = [
        ...chartDataRef.current.highLatencyData,
        ...newHighLatencyData,
      ]
        .sort((a, b) => a[0] - b[0])
        .slice(-maxDataPoints!);

      // chartDataRef 업데이트
      chartDataRef.current = {
        timeSeriesData: updatedTimeSeriesData,
        highLatencyData: updatedHighLatencyData,
      };

      try {
        // 차트 옵션 업데이트
        chartInstanceRef.current?.setOption({
          series: [
            { data: updatedTimeSeriesData },
            { data: updatedHighLatencyData },
          ],
        });

        // 축 범위 자동 조정
        if (
          updatedTimeSeriesData.length > 0 ||
          updatedHighLatencyData.length > 0
        ) {
          const allPoints = [
            ...updatedTimeSeriesData,
            ...updatedHighLatencyData,
          ];
          const timestamps = allPoints.map((point) => point[0]);
          const minTime = Math.min(...timestamps);
          const maxTime = Math.max(...timestamps);
          const latencies = allPoints.map((point) => point[1]);
          const maxLatency = Math.max(...latencies, 1) * 1.2;

          chartInstanceRef.current?.setOption({
            xAxis: { min: minTime, max: maxTime },
            yAxis: { min: 0, max: maxLatency },
          });
        }
      } catch (error) {
        console.error("차트 업데이트 중 오류 발생:", error);
      }
    }

    return hasNewData;
  }, [latencyThreshold, maxDataPoints]);

  // 차트 리사이즈 처리
  const handleResize = useMemo(() => debounce(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.resize();
    }
  }, 300), []);

  // 컴포넌트 마운트/언마운트 이펙트
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    
    // 컴포넌트 마운트 후 차트 크기 조정
    setTimeout(() => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.resize();
      }
    }, 0);

    return () => {
      window.removeEventListener("resize", handleResize);
      handleResize.cancel();
      
      // 컴포넌트 언마운트 시 차트 인스턴스 정리
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }
    };
  }, [handleResize]);

  // 데이터 변경 시 처리
  useEffect(() => {
    // 차트 초기화
    const chartInstance = initChart();

    // 차트가 초기화되었으면 데이터 처리
    if (chartInstance && traceData && traceData.length > 0) {
      processTraceData(traceData);
    }
  }, [initChart, traceData, processTraceData]);
  
  // 필터링 처리
  useEffect(() => {
    if (chartInstanceRef.current && dataFilters) {
      // 데이터 필터에 따라 표시되는 데이터 조정
      let filteredTimeSeriesData = [...chartDataRef.current.timeSeriesData];
      let filteredHighLatencyData = [...chartDataRef.current.highLatencyData];
      
      // 트레이스 데이터를 기반으로 필터링된 데이터 포인트 계산
      // 실제 구현에서는 traceData와 dataPoint를 매핑할 수 있는 메타데이터가 필요함
      // 여기서는 단순화된 예시만 제공
      
      // 차트 업데이트
      if (chartInstanceRef.current) {
        chartInstanceRef.current.setOption({
          series: [
            { 
              name: "일반 요청",
              data: legendState.normal ? filteredTimeSeriesData : []
            },
            { 
              name: "고지연 요청",
              data: legendState.highLatency ? filteredHighLatencyData : []
            }
          ]
        });
      }
    }
  }, [dataFilters, legendState]);

  return {
    chartRef,
    isLoading,
    setIsLoading,
    chartHeight: chartHeight || DEFAULT_CONFIG.height,
    chartData: chartDataRef.current,
  };
}