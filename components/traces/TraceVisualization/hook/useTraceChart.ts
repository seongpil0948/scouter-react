// hooks/useTraceChart.ts
import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import * as echarts from 'echarts';
import { useTheme } from 'next-themes';
import debounce from 'lodash.debounce';
import { useChartStore } from '@/lib/store/chartStore';
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
  
  // 마운트 상태 추적
  const isMountedRef = useRef<boolean>(true);
  
  // 차트 생성 중복 방지용 락
  const isInitializingRef = useRef<boolean>(false);
  
  // 데이터 참조 저장
  const traceDataRef = useRef<TraceItem[]>(traceData);
  
  // 컴포넌트 마운트/언마운트 추적
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Zustand 스토어에서 상태 가져오기
  const { 
    legendState,
    isRefreshing,
    dataFilters
  } = useChartStore();
  
  // 메모이제이션된 설정
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config]);
  
  const {
    title: chartTitle,
    height: chartHeight,
    latencyThreshold,
    colors,
    symbolSizes,
  } = mergedConfig;

  // 차트 데이터 상태 - useRef로 사용하여 리렌더링 방지
  const chartDataRef = useRef<{
    timeSeriesData: DataPoint[];
    highLatencyData: DataPoint[];
  }>({
    timeSeriesData: [],
    highLatencyData: [],
  });
  
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

  // 툴팁 설정 - 메모이제이션
  const getTooltip = useMemo(() => ({
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

  // 차트 초기 옵션 - 메모이제이션
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
          "일반 요청": legendState.normal,
          "고지연 요청": legendState.highLatency,
        },
      },
      tooltip: getTooltip,
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
  }, [chartTitle, theme, getTheme, getTooltip, symbolSizes, colors, legendState]);

  // 차트 초기화 함수 - 안정적인 의존성 유지
  const initChart = useCallback(() => {
    // 이미 초기화 중이거나 마운트 해제된 경우 중단
    if (isInitializingRef.current || !isMountedRef.current || !chartRef.current) {
      return null;
    }
    
    try {
      isInitializingRef.current = true;
      
      // 기존 차트 인스턴스가 있으면 안전하게 제거
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.dispose();
          chartInstanceRef.current = null;
        } catch (error) {
          console.error("Failed to dispose chart:", error);
        }
      }

      // 마운트 해제됐을 가능성 다시 확인
      if (!isMountedRef.current || !chartRef.current) {
        return null;
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
          const traces = traceDataRef.current;

          // 클릭된 지점과 가장 가까운 트레이스 찾기
          const closestTrace = traces.reduce((closest, trace) => {
            const currentDiff = Math.abs(trace.startTime - timestamp);
            const closestDiff = Math.abs((closest?.startTime || 0) - timestamp);

            return currentDiff < closestDiff ? trace : closest;
          }, traces[0]);

          if (closestTrace) {
            onDataPointClick(closestTrace);
          }
        }
      });

      return chartInstance;
    } catch (error) {
      console.error("Error initializing chart:", error);
      return null;
    } finally {
      isInitializingRef.current = false;
    }
  }, [theme, getInitialOption, onDataPointClick, isMountedRef]);

  // 트레이스 데이터 처리 함수 - useCallback으로 메모이제이션
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
      // 기존 데이터와 병합 - 중복 데이터 방지를 위한 Map 사용
      const timeSeriesMap = new Map<number, DataPoint>();
      const highLatencyMap = new Map<number, DataPoint>();
      
      // 기존 데이터 Map에 추가
      chartDataRef.current.timeSeriesData.forEach(point => {
        timeSeriesMap.set(point[0], point);
      });
      
      chartDataRef.current.highLatencyData.forEach(point => {
        highLatencyMap.set(point[0], point);
      });
      
      // 새 데이터 Map에 추가
      newData.forEach(point => {
        timeSeriesMap.set(point[0], point);
      });
      
      newHighLatencyData.forEach(point => {
        highLatencyMap.set(point[0], point);
      });
      
      // Map을 배열로 변환하고 정렬 후 최대 개수 제한
      const updatedTimeSeriesData = Array.from(timeSeriesMap.values())
        .sort((a, b) => a[0] - b[0])

      const updatedHighLatencyData = Array.from(highLatencyMap.values())
        .sort((a, b) => a[0] - b[0])

      // chartDataRef 업데이트
      chartDataRef.current = {
        timeSeriesData: updatedTimeSeriesData,
        highLatencyData: updatedHighLatencyData,
      };

      try {
        // 차트 옵션 업데이트
        chartInstanceRef.current?.setOption({
          series: [
            { 
              data: legendState.normal ? updatedTimeSeriesData : [],
            },
            { 
              data: legendState.highLatency ? updatedHighLatencyData : [],
            },
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
  }, [latencyThreshold, legendState]);

  // 차트 리사이즈 처리 - 메모이제이션된 디바운스 함수
  const handleResize = useMemo(() => debounce(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.resize();
    }
  }, 300), []);

  // 범례 상태에 따른 시리즈 표시 설정
  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.setOption({
        legend: {
          selected: {
            "일반 요청": legendState.normal,
            "고지연 요청": legendState.highLatency,
          }
        },
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

  // traceData가 변경될 때만 참조 업데이트
  useEffect(() => {
    traceDataRef.current = traceData;
  }, [traceData]);

  // 차트 초기화 및 리사이즈 처리를 위한 통합 effect
  useEffect(() => {
    // 이미 언마운트됐을 가능성 확인
    if (!isMountedRef.current) return;
    
    // 차트 초기화 전 잠시 대기
    const initTimer = setTimeout(() => {
      // 차트 초기화
      const chartInstance = initChart();
      
      // 데이터가 있으면 처리
      if (isMountedRef.current && traceData.length > 0 && chartInstanceRef.current) {
        processTraceData(traceData);
      }
    }, 10);
    
    // 리사이즈 이벤트 리스너 등록
    window.addEventListener("resize", handleResize);
    
    // 차트 초기 크기 조정 (약간의 지연으로 안정적인 렌더링 보장)
    const resizeTimer = setTimeout(() => {
      if (isMountedRef.current && chartInstanceRef.current && chartRef.current) {
        try {
          chartInstanceRef.current.resize();
        } catch (error) {
          console.error("Chart resize error:", error);
        }
      }
    }, 100);
    
    // 클린업 함수
    return () => {
      // 타이머 제거
      clearTimeout(initTimer);
      clearTimeout(resizeTimer);
      
      // 이벤트 리스너 제거
      window.removeEventListener("resize", handleResize);
      handleResize.cancel();
      
      // 차트 인스턴스 안전하게 정리 - setTimeout으로 DOM 조작 순서 문제 해결
      setTimeout(() => {
        if (chartInstanceRef.current) {
          try {
            chartInstanceRef.current.dispose();
          } catch (error) {
            console.error("Chart disposal error:", error);
          }
          chartInstanceRef.current = null;
        }
      }, 0);
    };
  }, [traceData, initChart, processTraceData, handleResize, isMountedRef]);
  
  // 다크 모드 변경 감지 - 별도 effect로 분리하고 실행 지연 추가
  useEffect(() => {
    // 마운트 상태 및 차트 존재 여부 확인
    if (!isMountedRef.current || !chartRef.current) return;
    
    // 테마 변경 시 약간의 지연 후 실행 (렌더링 사이클 안정화)
    const themeChangeTimer = setTimeout(() => {
      // 마운트 상태 재확인
      if (!isMountedRef.current || !chartRef.current) return;
      
      if (chartInstanceRef.current) {
        // 기존 데이터 백업
        const oldTimeSeriesData = [...chartDataRef.current.timeSeriesData];
        const oldHighLatencyData = [...chartDataRef.current.highLatencyData];
        
        // 차트 재초기화 (이전 차트는 자동으로 dispose됨)
        const newChart = initChart();
        
        // 백업한 데이터로 새 차트 업데이트
        if (newChart && (oldTimeSeriesData.length > 0 || oldHighLatencyData.length > 0)) {
          // 차트 옵션 업데이트
          try {
            newChart.setOption({
              series: [
                { 
                  data: legendState.normal ? oldTimeSeriesData : [],
                },
                { 
                  data: legendState.highLatency ? oldHighLatencyData : [],
                },
              ],
            });
          } catch (error) {
            console.error("Theme change chart update error:", error);
          }
        }
      }
    }, 200);
    
    return () => {
      clearTimeout(themeChangeTimer);
    };
  }, [theme, initChart, legendState, isMountedRef]);
  
  // 필터링 변경 감지
  useEffect(() => {
    if (chartInstanceRef.current && Object.keys(dataFilters).length > 0) {
      // 필터가 변경되면 차트 업데이트
      // 필요한 경우 여기에 필터링 로직 추가
    }
  }, [dataFilters]);

  return {
    chartRef,
    isLoading,
    setIsLoading,
    chartHeight: chartHeight || DEFAULT_CONFIG.height,
    chartData: chartDataRef.current,
  };
}