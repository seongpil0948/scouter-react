"use client";
import React, { useEffect, useCallback, useRef, useState } from "react";
import * as echarts from "echarts";
import debounce from "lodash.debounce";
import { Card, CardBody } from "@heroui/card";
import { LogItem } from "@/lib/store/telemetryStore";

interface ChartConfig {
  title?: string;
  height?: string | number;
  theme?: "light" | "dark";
  maxDataPoints?: number;
  autoUpdate?: boolean;
  updateInterval?: number;
  colors?: {
    [key in "FATAL" | "ERROR" | "WARN" | "INFO" | "DEBUG" | "TRACE"]?: string;
  };
  symbolSizes?: {
    [key in "FATAL" | "ERROR" | "WARN" | "INFO" | "DEBUG" | "TRACE"]?: number;
  };
}

interface LogVisualizationProps {
  logData: LogItem[];
  onDataPointClick: (log: LogItem) => void;
  config?: ChartConfig;
  queryFn?: (params: any) => Promise<any>;
  queryParams?: any;
}

type DataPoint = [number, number, string]; // [timestamp, severityValue, severity]

// 심각도 수준을 숫자 값으로 매핑
const severityToValueMap: Record<string, number> = {
  FATAL: 5,
  ERROR: 4,
  WARN: 3,
  INFO: 2,
  DEBUG: 1,
  TRACE: 0,
};

// 기본 설정 값
const DEFAULT_CONFIG: ChartConfig = {
  title: "로그 발생 패턴 모니터링",
  height: 600,
  theme: "light",
  maxDataPoints: 100,
  autoUpdate: false,
  updateInterval: 30000,
  colors: {
    FATAL: "#9c1e1e", // 진한 빨강
    ERROR: "#ff4d4f", // 빨강
    WARN: "#faad14", // 노랑
    INFO: "#1890ff", // 파랑
    DEBUG: "#52c41a", // 초록
    TRACE: "#d9d9d9", // 회색
  },
  symbolSizes: {
    FATAL: 20,
    ERROR: 16,
    WARN: 14,
    INFO: 10,
    DEBUG: 8,
    TRACE: 6,
  },
};

/**
 * 로그 시각화 컴포넌트
 * - 로그 데이터를 심각도별로 시각화
 * - 심각도에 따라 다른 크기와 효과 적용
 * - 커스터마이징 가능한 설정 지원
 */
const LogVisualization: React.FC<LogVisualizationProps> = ({
  logData,
  onDataPointClick,
  config = {},
  queryFn,
  queryParams = {},
}) => {
  // 설정 병합
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const {
    title,
    height,
    theme,
    maxDataPoints = DEFAULT_CONFIG.maxDataPoints, // added default to fix TS error
    autoUpdate,
    updateInterval,
    colors = DEFAULT_CONFIG.colors,
    symbolSizes = DEFAULT_CONFIG.symbolSizes,
  } = mergedConfig;

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const lastProcessedTimestampRef = useRef<number>(0);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChartInitialized, setIsChartInitialized] = useState<boolean>(false);
  const [chartData, setChartData] = useState<{
    [key: string]: DataPoint[];
  }>({
    FATAL: [],
    ERROR: [],
    WARN: [],
    INFO: [],
    DEBUG: [],
    TRACE: [],
  });

  // 차트 테마 설정
  const getTheme = () => {
    if (theme === "dark") {
      return {
        backgroundColor: "#141414",
        textStyle: { color: "#ffffff" },
        axisLine: { lineStyle: { color: "#333" } },
        splitLine: { lineStyle: { color: "#333" } },
      };
    }
    return {};
  };

  // 초기 차트 옵션 생성
  const getInitialOption = useCallback(() => {
    const themeOptions = getTheme();
    const severities = ["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"];

    return {
      ...themeOptions,
      animation: true,
      title: {
        text: title,
        left: "center",
        textStyle: theme === "dark" ? { color: "#fff" } : undefined,
      },
      legend: {
        data: severities,
        right: 10,
        top: 10,
        selected: severities.reduce(
          (acc, severity) => {
            acc[severity] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        ),
        textStyle: theme === "dark" ? { color: "#fff" } : undefined,
      },
      tooltip: {
        show: true,
        trigger: "item",
        backgroundColor:
          theme === "dark" ? "rgba(50,50,50,0.9)" : "rgba(255,255,255,0.9)",
        borderColor: theme === "dark" ? "#333" : "#ccc",
        textStyle: { color: theme === "dark" ? "#fff" : "#333" },
        extraCssText: "box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);",
        formatter: function (params: any) {
          if (!params.value || params.value.length < 3) {
            return "데이터 없음";
          }

          const timestamp = params.value[0];
          const severity = params.value[2];
          const date = new Date(timestamp);
          const colorValue =
            colors?.[severity as keyof typeof colors] ||
            DEFAULT_CONFIG.colors?.[
              severity as keyof typeof DEFAULT_CONFIG.colors
            ];

          return `
          <div style="font-weight: bold; margin-bottom: 5px;">
            ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>심각도:</span>
            <span style="font-weight: bold; color: ${colorValue}">
              ${severity}
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
          fillerColor:
            theme === "dark" ? "rgba(80,80,80,0.3)" : "rgba(200,200,200,0.3)",
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
        name: "심각도 수준",
        nameLocation: "middle",
        nameGap: 40,
        nameTextStyle: {
          color: theme === "dark" ? "#fff" : undefined,
        },
        min: 0,
        max: 5,
        interval: 1,
        axisLabel: {
          show: true,
          color: theme === "dark" ? "#ccc" : undefined,
          formatter: function (value: number) {
            const labels = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"];
            return labels[value] || "";
          },
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
          name: "FATAL",
          type: "effectScatter",
          symbol: "circle",
          symbolSize: symbolSizes?.FATAL || DEFAULT_CONFIG.symbolSizes?.FATAL,
          showEffectOn: "render",
          rippleEffect: {
            brushType: "stroke",
            scale: 4,
            period: 2.5,
          },
          itemStyle: {
            color: colors?.FATAL || DEFAULT_CONFIG.colors?.FATAL,
            shadowBlur: 10,
            shadowColor: "rgba(156, 30, 30, 0.5)",
          },
          emphasis: {
            scale: true,
          },
          data: [],
        },
        {
          name: "ERROR",
          type: "effectScatter",
          symbol: "circle",
          symbolSize: symbolSizes?.ERROR || DEFAULT_CONFIG.symbolSizes?.ERROR,
          showEffectOn: "render",
          rippleEffect: {
            brushType: "stroke",
            scale: 3.5,
            period: 3,
          },
          itemStyle: {
            color: colors?.ERROR || DEFAULT_CONFIG.colors?.ERROR,
            shadowBlur: 10,
            shadowColor: "rgba(255, 77, 79, 0.5)",
          },
          emphasis: {
            scale: true,
          },
          data: [],
        },
        {
          name: "WARN",
          type: "effectScatter",
          symbol: "circle",
          symbolSize: symbolSizes?.WARN || DEFAULT_CONFIG.symbolSizes?.WARN,
          showEffectOn: "render",
          rippleEffect: {
            brushType: "stroke",
            scale: 3,
            period: 4,
          },
          itemStyle: {
            color: colors?.WARN || DEFAULT_CONFIG.colors?.WARN,
            shadowBlur: 8,
            shadowColor: "rgba(250, 173, 20, 0.5)",
          },
          emphasis: {
            scale: true,
          },
          data: [],
        },
        {
          name: "INFO",
          type: "scatter",
          symbol: "circle",
          symbolSize: symbolSizes?.INFO || DEFAULT_CONFIG.symbolSizes?.INFO,
          itemStyle: {
            color: colors?.INFO || DEFAULT_CONFIG.colors?.INFO,
            opacity: 0.8,
            shadowBlur: 5,
            shadowColor: "rgba(24, 144, 255, 0.2)",
          },
          data: [],
        },
        {
          name: "DEBUG",
          type: "scatter",
          symbol: "circle",
          symbolSize: symbolSizes?.DEBUG || DEFAULT_CONFIG.symbolSizes?.DEBUG,
          itemStyle: {
            color: colors?.DEBUG || DEFAULT_CONFIG.colors?.DEBUG,
            opacity: 0.7,
            shadowBlur: 3,
            shadowColor: "rgba(82, 196, 26, 0.2)",
          },
          data: [],
        },
        {
          name: "TRACE",
          type: "scatter",
          symbol: "circle",
          symbolSize: symbolSizes?.TRACE || DEFAULT_CONFIG.symbolSizes?.TRACE,
          itemStyle: {
            color: colors?.TRACE || DEFAULT_CONFIG.colors?.TRACE,
            opacity: 0.6,
            shadowBlur: 2,
            shadowColor: "rgba(217, 217, 217, 0.2)",
          },
          data: [],
        },
      ],
    };
  }, [title, theme, colors, symbolSizes]);

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

          // 클릭된 지점과 가장 가까운 로그 찾기
          const closestLog = logData.reduce((closest, log) => {
            const currentDiff = Math.abs(log.timestamp - timestamp);
            const closestDiff = Math.abs((closest?.timestamp || 0) - timestamp);

            return currentDiff < closestDiff ? log : closest;
          }, logData[0]);

          if (closestLog) {
            onDataPointClick(closestLog);
          }
        }
      });

      setIsChartInitialized(true);
      return chartInstance;
    }
    return null;
  }, [getInitialOption, logData, onDataPointClick, theme]);

  // 로그 데이터 처리 함수
  const processLogData = useCallback(
    (newLogs: LogItem[]) => {
      if (!chartInstanceRef.current) {
        return false;
      }

      // 심각도별 데이터 준비
      const newDataBySeverity: { [key: string]: DataPoint[] } = {
        FATAL: [],
        ERROR: [],
        WARN: [],
        INFO: [],
        DEBUG: [],
        TRACE: [],
      };

      let hasNewData = false;

      // 새로운 데이터 처리
      newLogs.forEach((log) => {
        const timestamp = log.timestamp;

        const severity = log.severity || "INFO";
        const severityValue =
          severityToValueMap[severity] !== undefined
            ? severityToValueMap[severity]
            : 2; // 기본값은 INFO(2)

        if (timestamp) {
          const dataPoint: DataPoint = [timestamp, severityValue, severity];

          // 해당 심각도에 데이터 추가
          if (newDataBySeverity[severity]) {
            newDataBySeverity[severity].push(dataPoint);
          } else {
            // 알 수 없는 심각도면 INFO로 처리
            newDataBySeverity.INFO.push([timestamp, 2, "INFO"]);
          }

          hasNewData = true;
          lastProcessedTimestampRef.current = Math.max(
            lastProcessedTimestampRef.current,
            timestamp,
          );
        }
      });

      if (hasNewData) {
        // 현재 데이터 참조
        const currentData = { ...chartData };

        // 심각도별로 데이터 업데이트
        const severities = ["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"];
        const updatedDataBySeverity: { [key: string]: DataPoint[] } = {};

        severities.forEach((severity) => {
          // 새 데이터 추가 및 정렬
          updatedDataBySeverity[severity] = [
            ...(currentData[severity] || []),
            ...(newDataBySeverity[severity] || []),
          ]
            .sort((a, b) => a[0] - b[0])
            .slice(-maxDataPoints!); // non-null assertion added here
        });

        // 데이터 참조 업데이트
        setChartData(updatedDataBySeverity);

        // 시리즈 데이터 준비
        const seriesData = severities.map((severity) => ({
          data: updatedDataBySeverity[severity] || [],
        }));

        try {
          // ECharts 인스턴스에 직접 데이터 업데이트
          chartInstanceRef.current.setOption({
            series: seriesData,
          });

          // X축 범위 동적 조정
          // 모든 데이터를 합쳐서 최소/최대 타임스탬프 찾기
          const allDataPoints = Object.values(updatedDataBySeverity)
            .flat()
            .map((point) => point[0]);

          if (allDataPoints.length > 0) {
            const minTime = Math.min(...allDataPoints);
            const maxTime = Math.max(...allDataPoints);

            chartInstanceRef.current.setOption({
              xAxis: {
                min: minTime,
                max: maxTime,
              },
            });
          }
        } catch (error) {
          console.error("차트 업데이트 중 오류 발생:", error);
        }
      }

      return hasNewData;
    },
    [chartData, maxDataPoints],
  );

  // 데이터 가져오기 함수
  const fetchData = useCallback(async () => {
    if (!queryFn) return;

    try {
      setIsLoading(true);
      const result = await queryFn(queryParams);

      if (result && Array.isArray(result)) {
        processLogData(result);
      }
    } catch (error) {
      console.error("데이터 가져오기 오류:", error);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, queryParams, processLogData]);

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

  // 컴포넌트 마운트 시 차트 초기화
  useEffect(() => {
    const chartInstance = initChart();

    return () => {
      // 컴포넌트 언마운트 시 차트 인스턴스 정리
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }
    };
  }, [initChart]);

  // 로그 데이터 변경 효과
  useEffect(() => {
    if (isChartInitialized && logData.length > 0) {
      processLogData(logData);
    }
  }, [logData, processLogData, isChartInitialized]);

  // 리사이즈 핸들러
  useEffect(() => {
    const handleResize = debounce(() => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.resize();
      }
    }, 300);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      handleResize.cancel();
    };
  }, []);

  return (
    <Card>
      <CardBody className="p-4">
        {logData.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-96 text-gray-500">
            <p>
              로그 데이터가 로드되지 않았습니다. 데이터가 수신되면 여기에
              표시됩니다.
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
            className="w-full log-chart" // removed inline styles; define height via external CSS
          />
        )}
      </CardBody>
    </Card>
  );
};

export default React.memo(LogVisualization);
