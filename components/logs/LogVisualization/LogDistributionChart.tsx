import React, { useMemo } from "react";
import { Card, CardBody } from "@heroui/card";
import * as echarts from "echarts";
import { useTheme } from "next-themes";
import { useECharts } from "@/components/traces/TraceVisualization/hook/useEchart";

interface LogDistributionChartProps {
  logs: LogItem[];
  height?: number | string;
  title?: string;
}

const LogDistributionChart: React.FC<LogDistributionChartProps> = ({
  logs,
  height = 300,
  title = "시간별 로그 분포",
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { chartContainerRef } = useECharts({
    theme: isDark ? "dark" : undefined,
  });

  // 로그 데이터 처리
  const chartData = useMemo(() => {
    // 시간별로 로그 그룹화
    const timeMap: Record<
      number,
      { total: number; byLevel: Record<string, number> }
    > = {};
    const levelSet = new Set<string>();

    // 5분 간격으로 그룹화
    const INTERVAL = 5 * 60 * 1000; // 5분

    logs.forEach((log) => {
      // 5분 단위로 시간 반올림
      const timeKey = Math.floor(log.timestamp / INTERVAL) * INTERVAL;

      if (!timeMap[timeKey]) {
        timeMap[timeKey] = { total: 0, byLevel: {} };
      }

      timeMap[timeKey].total++;

      // 심각도별 카운트
      const level = log.severity;
      levelSet.add(level);

      if (!timeMap[timeKey].byLevel[level]) {
        timeMap[timeKey].byLevel[level] = 0;
      }
      timeMap[timeKey].byLevel[level]++;
    });

    // 시간 순으로 정렬된 배열로 변환
    const timeKeys = Object.keys(timeMap)
      .map(Number)
      .sort((a, b) => a - b);
    const levels = Array.from(levelSet);

    // 시리즈 데이터 생성
    const series = levels.map((level) => ({
      name: level,
      type: "bar",
      stack: "total",
      data: timeKeys.map((time) => timeMap[time].byLevel[level] || 0),
    }));

    return {
      times: timeKeys.map((time) => new Date(time).toLocaleTimeString()),
      series,
      levels,
    };
  }, [logs]);

  // 차트 옵션
  const options = useMemo(() => {
    return {
      title: {
        text: title,
        left: "center",
        textStyle: {
          color: isDark ? "#ffffff" : "#333333",
        },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      legend: {
        data: chartData.levels,
        top: "30px",
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: chartData.times,
      },
      yAxis: {
        type: "value",
      },
      series: chartData.series,
      color: [
        "#fc8452", // ERROR - 주황색
        "#ea7ccc", // FATAL - 자주색
        "#5470c6", // INFO - 파란색
        "#91cc75", // DEBUG - 초록색
        "#73c0de", // TRACE - 하늘색
      ],
    };
  }, [chartData, isDark, title]);

  // 차트 업데이트
  React.useEffect(() => {
    const chartInstance = echarts.getInstanceByDom(chartContainerRef.current!);
    if (chartInstance) {
      chartInstance.setOption(options);
    }
  }, [chartContainerRef, options]);

  return (
    <Card>
      <CardBody>
        <div ref={chartContainerRef} style={{ height }} />
      </CardBody>
    </Card>
  );
};

export default LogDistributionChart;
