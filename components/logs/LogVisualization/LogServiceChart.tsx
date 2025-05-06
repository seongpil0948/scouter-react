import React, { useMemo } from "react";
import { Card, CardBody } from "@heroui/card";
import * as echarts from "echarts";
import { useTheme } from "next-themes";
import { useECharts } from "@/components/traces/TraceVisualization/hook/useEchart";

interface LogServiceChartProps {
  logs: LogItem[];
  height?: number | string;
  title?: string;
}

const LogServiceChart: React.FC<LogServiceChartProps> = ({
  logs,
  height = 300,
  title = "서비스별 로그 분포",
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { chartContainerRef } = useECharts({
    theme: isDark ? "dark" : undefined,
  });

  // 로그 데이터 처리
  const chartData = useMemo(() => {
    // 서비스별 로그 카운트
    const serviceCounts: Record<string, number> = {};

    logs.forEach((log) => {
      const service = log.serviceName;
      if (!serviceCounts[service]) {
        serviceCounts[service] = 0;
      }
      serviceCounts[service]++;
    });

    // 차트 데이터 변환 (값 기준 내림차순 정렬)
    const data = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    return data;
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
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
      },
      yAxis: {
        type: "category",
        data: chartData.map((item) => item.name),
        axisTick: {
          alignWithLabel: true,
        },
      },
      series: [
        {
          name: "로그 수",
          type: "bar",
          data: chartData.map((item) => ({
            value: item.value,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: isDark ? "#1a90ff" : "#0050b3" },
                { offset: 1, color: isDark ? "#69c0ff" : "#1890ff" },
              ]),
            },
          })),
        },
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

export default LogServiceChart;
