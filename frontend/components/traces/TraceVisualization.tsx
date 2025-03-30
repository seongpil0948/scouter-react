"use client";
import React, { useEffect, useCallback, useRef, useState } from "react";
import * as echarts from "echarts";
import debounce from "lodash.debounce";
import { Card, CardBody } from "@heroui/card";
import { TraceItem } from "@/lib/store/telemetryStore";

interface ChartConfig {
  title?: string;
  height?: string | number;
  theme?: 'light' | 'dark';
  maxDataPoints?: number;
  latencyThreshold?: number;
  autoUpdate?: boolean;
  updateInterval?: number;
  colors?: {
    low?: string;
    medium?: string;
    high?: string;
    critical?: string;
    effectScatter?: string;
  };
  symbolSizes?: {
    min?: number;
    max?: number;
    effectMin?: number;
    effectMax?: number;
  };
}

interface TraceVisualizationProps {
  traceData: TraceItem[];
  onDataPointClick: (trace: TraceItem) => void;
  config?: ChartConfig;
  height?: string | number;
  title?: string;
  queryFn?: (params: any) => Promise<any>;
  queryParams?: any;
}

type DataPoint = [number, number]; // [timestamp, latency]

// 기본 설정 값
const DEFAULT_CONFIG: ChartConfig = {
  title: "실시간 지연 시간 모니터링",
  height: 600,
  theme: 'light',
  maxDataPoints: 100,
  latencyThreshold: 300,
  autoUpdate: false,
  updateInterval: 30000,
  colors: {
    low: "#52c41a",
    medium: "#1890ff",
    high: "#faad14",
    critical: "#ff4d4f",
    effectScatter: "#ff4d4f",
  },
  symbolSizes: {
    min: 8,
    max: 18,
    effectMin: 15,
    effectMax: 30,
  }
};

/**
 * 트레이스 시각화 컴포넌트
 * - 실시간 지연 시간 모니터링을 위한 시각화 제공
 * - 재사용 가능한 쿼리 함수 지원
 * - 고급 차트 옵션 구성 가능
 */
const TraceVisualization: React.FC<TraceVisualizationProps> = ({
  traceData,
  onDataPointClick,
  config = {},
  height, // 직접 높이 prop 사용
  title, // 직접 제목 prop 사용
  queryFn,
  queryParams = {},
}) => {
  // 설정 병합 (height와 title은 별도 prop으로 받은 것이 우선)
  const mergedConfig = { 
    ...DEFAULT_CONFIG, 
    ...config,
    height: height || config.height || DEFAULT_CONFIG.height,
    title: title || config.title || DEFAULT_CONFIG.title
  };
  
  const {
    title: chartTitle,
    height: chartHeight,
    theme,
    maxDataPoints = DEFAULT_CONFIG.maxDataPoints,
    latencyThreshold = DEFAULT_CONFIG.latencyThreshold,
    autoUpdate,
    updateInterval,
    colors,
    symbolSizes,
  } = mergedConfig;

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const lastProcessedTimestampRef = useRef<number>(0);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChartInitialized, setIsChartInitialized] = useState<boolean>(false);
  const [chartData, setChartData] = useState<{
    timeSeriesData: DataPoint[];
    highLatencyData: DataPoint[];
  }>({
    timeSeriesData: [],
    highLatencyData: [],
  });

  // 차트 테마 설정
  const getTheme = () => {
    if (theme === 'dark') {
      return {
        backgroundColor: '#141414',
        textStyle: { color: '#ffffff' },
        axisLine: { lineStyle: { color: '#333' } },
        splitLine: { lineStyle: { color: '#333' } },
      };
    }
    return {};
  };

  // 초기 차트 옵션 생성
  const getInitialOption = useCallback(() => {
    const themeOptions = getTheme();

    return {
      ...themeOptions,
      animation: true,
      title: {
        text: chartTitle,
        left: "center",
        textStyle: theme === 'dark' ? { color: '#fff' } : undefined,
      },
      legend: {
        data: ["일반 요청", "고지연 요청"],
        right: 10,
        top: 10,
        selected: {
          "일반 요청": true,
          "고지연 요청": true
        },
        textStyle: theme === 'dark' ? { color: '#fff' } : undefined,
      },
      tooltip: {
        show: true,
        trigger: "item",
        backgroundColor: theme === 'dark' ? 'rgba(50,50,50,0.9)' : 'rgba(255,255,255,0.9)',
        borderColor: theme === 'dark' ? '#333' : '#ccc',
        textStyle: { color: theme === 'dark' ? '#fff' : '#333' },
        extraCssText: 'box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);',
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
      },
      toolbox: {
        show: true,
        feature: {
          dataZoom: {
            yAxisIndex: "none",
            icon: {
              zoom: 'path://M10.525 5.025a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM.75 12.525a9.75 9.75 0 1119.5 0 9.75 9.75 0 01-19.5 0zm17.53 7.78a.75.75 0 011.06 0l4.5 4.5a.75.75 0 11-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06z',
              back: 'path://M11.78 5.22a.75.75 0 0 1 0 1.06l-3.72 3.72h11.19a.75.75 0 0 1 0 1.5H8.06l3.72 3.72a.75.75 0 1 1-1.06 1.06l-5-5a.751.751 0 0 1 0-1.06l5-5a.75.75 0 0 1 1.06 0'
            }
          },
          restore: {
            icon: 'path://M4.75 4a.75.75 0 0 1 .75.75v1.5h9V4.75a.75.75 0 0 1 1.5 0v1.5h2.25c.966 0 1.75.784 1.75 1.75v11.5A1.75 1.75 0 0 1 18.25 21H2.75A1.75 1.75 0 0 1 1 19.5V8c0-.966.784-1.75 1.75-1.75H5v-1.5A.75.75 0 0 1 4.75 4m13.5 7V8a.25.25 0 0 0-.25-.25H2.75A.25.25 0 0 0 2.5 8v3h15.75m0 1.5H2.5v8c0 .138.112.25.25.25h15.5a.25.25 0 0 0 .25-.25v-8'
          },
          saveAsImage: {
            icon: 'path://M10 1.5a.75.75 0 0 1 .75.75v1h1.5a.75.75 0 0 1 0 1.5h-1.5v1a.75.75 0 0 1-1.5 0v-1h-1.5a.75.75 0 0 1 0-1.5h1.5v-1A.75.75 0 0 1 10 1.5M4 8a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm7-1a4 4 0 1 0 0 8 4 4 0 0 0 0-8m-4 4a4 4 0 1 1 8 0 4 4 0 0 1-8 0'
          }
        },
        right: 10,
        iconStyle: {
          borderColor: theme === 'dark' ? '#666' : '#666',
          color: theme === 'dark' ? '#ddd' : '#333',
        },
      },
      dataZoom: [
        {
          type: "inside",
          start: 0,
          end: 100,
          zoomLock: false,
          filterMode: 'filter',
        },
        {
          start: 0,
          end: 100,
          bottom: 10,
          height: 20,
          borderColor: theme === 'dark' ? '#444' : '#ddd',
          textStyle: {
            color: theme === 'dark' ? '#fff' : undefined,
          },
          fillerColor: theme === 'dark' ? 'rgba(80,80,80,0.3)' : 'rgba(200,200,200,0.3)',
          filterMode: 'filter',
        },
      ],
      xAxis: {
        type: "time",
        boundaryGap: false,
        name: "시간",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: {
          color: theme === 'dark' ? '#fff' : undefined,
        },
        scale: true,
        axisLabel: {
          formatter: (value: number) => new Date(value).toLocaleTimeString(),
          show: true,
          color: theme === 'dark' ? '#ccc' : undefined,
        },
        axisLine: {
          lineStyle: {
            color: theme === 'dark' ? '#444' : '#ccc',
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            opacity: theme === 'dark' ? 0.2 : 0.3,
            color: theme === 'dark' ? '#444' : '#ddd',
          },
        },
      },
      yAxis: {
        type: "value",
        name: "지연 시간 (ms)",
        nameLocation: "middle",
        nameGap: 40,
        nameTextStyle: {
          color: theme === 'dark' ? '#fff' : undefined,
        },
        min: 0,
        scale: true,
        axisLabel: {
          show: true,
          color: theme === 'dark' ? '#ccc' : undefined,
        },
        axisLine: {
          lineStyle: {
            color: theme === 'dark' ? '#444' : '#ccc',
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            opacity: theme === 'dark' ? 0.2 : 0.3,
            color: theme === 'dark' ? '#444' : '#ddd',
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
              if (!params.value || params.value.length < 2) return colors?.medium || DEFAULT_CONFIG.colors?.medium;
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
              borderWidth: 2
            }
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
            scale: true
          },
          data: [],
        },
      ],
    };
  }, [
    chartTitle, 
    theme, 
    latencyThreshold, 
    colors, 
    symbolSizes
  ]);

  // 차트 초기화 함수
  const initChart = useCallback(() => {
    if (chartRef.current) {
      // 기존 차트 인스턴스가 있으면 제거
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }

      // 새 차트 인스턴스 생성
      const chartInstance = echarts.init(chartRef.current, theme === 'dark' ? 'dark' : undefined);
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

      setIsChartInitialized(true);
      return chartInstance;
    }
    return null;
  }, [getInitialOption, traceData, onDataPointClick, theme]);

  // 트레이스 데이터 처리 함수
  const processTraceData = useCallback((newTraces: TraceItem[]) => {
    if (!chartInstanceRef.current) {
      return false;
    }
    
    let newData: DataPoint[] = [];
    let newHighLatencyData: DataPoint[] = [];
    let hasNewData = false;

    // 새로운 데이터 처리
    newTraces.forEach((trace) => {
      if (!trace || !trace.startTime || trace.duration === undefined) {
        return; // 유효하지 않은 데이터는 건너뜀
      }
      
      const timestamp = trace.startTime;
      const latency = trace.duration;
      const thresholdValue = latencyThreshold || DEFAULT_CONFIG.latencyThreshold!;

      // 데이터 유효성 검사
      if (timestamp && latency !== undefined && !isNaN(timestamp) && !isNaN(latency)) {
        const dataPoint: DataPoint = [timestamp, latency];

        newData.push(dataPoint);

        if (latency > thresholdValue) {
          newHighLatencyData.push(dataPoint);
        }

        hasNewData = true;
        lastProcessedTimestampRef.current = Math.max(
          lastProcessedTimestampRef.current,
          timestamp
        );
      }
    });

    if (hasNewData) {
      // 기존 데이터와 병합: use functional update to avoid stale state issues.
      setChartData(prevData => {
        const updatedTimeSeriesData = [...prevData.timeSeriesData, ...newData]
          .sort((a, b) => a[0] - b[0])
          .slice(-maxDataPoints!); // maxDataPoints가 undefined일 수 없다고 TypeScript에 알려줌
          
        const updatedHighLatencyData = [...prevData.highLatencyData, ...newHighLatencyData]
          .sort((a, b) => a[0] - b[0])
          .slice(-maxDataPoints!);
  
        try {
          // 차트 옵션 업데이트
          chartInstanceRef.current?.setOption({
            series: [
              { data: updatedTimeSeriesData },
              { data: updatedHighLatencyData },
            ],
          });
  
          // 축 범위 자동 조정
          if (updatedTimeSeriesData.length > 0 || updatedHighLatencyData.length > 0) {
            const allPoints = [...updatedTimeSeriesData, ...updatedHighLatencyData];
            const timestamps = allPoints.map(point => point[0]);
            const minTime = Math.min(...timestamps);
            const maxTime = Math.max(...timestamps);
            const latencies = allPoints.map(point => point[1]);
            const maxLatency = Math.max(...latencies, 1) * 1.2;
  
            chartInstanceRef.current?.setOption({
              xAxis: { min: minTime, max: maxTime },
              yAxis: { min: 0, max: maxLatency },
            });
          }
        } catch (error) {
          console.error("차트 업데이트 중 오류 발생:", error);
        }
  
        return { 
          timeSeriesData: updatedTimeSeriesData, 
          highLatencyData: updatedHighLatencyData 
        };
      });
    }

    return hasNewData;
  }, [latencyThreshold, maxDataPoints]);

  // 데이터 가져오기 함수
  const fetchData = useCallback(async () => {
    if (!queryFn) return;
    
    try {
      setIsLoading(true);
      const result = await queryFn(queryParams);
      
      if (result && Array.isArray(result)) {
        processTraceData(result);
      }
    } catch (error) {
      console.error("데이터 가져오기 오류:", error);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, queryParams, processTraceData]);

  // 자동 업데이트 설정
  useEffect(() => {
    // 자동 업데이트 활성화 및 쿼리 함수가 있는 경우
    if (autoUpdate && queryFn) {
      // 최초 데이터 로드
      fetchData();
      
      // 주기적으로 데이터 업데이트
      refreshTimerRef.current = setInterval(fetchData, updateInterval);
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoUpdate, updateInterval, fetchData, queryFn]);

  // 차트 초기화 및 데이터 로드 시퀀스 조정
  useEffect(() => {
    // 차트 초기화
    const chartInstance = initChart();
    
    // 차트가 초기화되었으면 데이터 처리
    if (chartInstance && traceData && traceData.length > 0) {
      processTraceData(traceData);
    }
    
    return () => {
      // 컴포넌트 언마운트 시 차트 인스턴스 정리
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }
    };
  }, [initChart, traceData, processTraceData]);

  // 차트 리사이즈
  useEffect(() => {
    // 리사이즈 핸들러
    const handleResize = debounce(() => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.resize();
      }
    }, 300);

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
    };
  }, []);

  return (
    <Card className="w-full">
      <CardBody className="p-4">
        {traceData.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-96 text-gray-500">
            <p>
              데이터가 로드되지 않았습니다. 데이터가 수신되면 여기에 표시됩니다.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-96 text-gray-500">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <p className="mt-4">데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <div 
            ref={chartRef}
            style={{ 
              width: '100%', 
              height: typeof chartHeight === 'number' ? `${chartHeight}px` : chartHeight 
            }}
          />
        )}
      </CardBody>
    </Card>
  );
};

export default React.memo(TraceVisualization);