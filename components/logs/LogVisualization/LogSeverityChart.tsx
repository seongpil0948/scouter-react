import React, { useMemo } from "react";
import { Card, CardBody } from "@heroui/card";
import * as echarts from "echarts";
import { useTheme } from "next-themes";
import { useECharts } from "@/components/traces/TraceVisualization/hook/useEchart";

interface LogSeverityChartProps {
  logs: LogItem[];
  height?: number | string;
  title?: string;
}

const LogSeverityChart: React.FC<LogSeverityChartProps> = ({
  logs,
  height = 300,
  title = "심각도별 로그 분포",
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { chartContainerRef } = useECharts({
    theme: isDark ? "dark" : undefined,
  });

  // 로그 데이터 처리
  const chartData = useMemo(() => {
    // 심각도별 로그 카운트
    const severityCounts: Record<string, number> = {};

    logs.forEach((log) => {
      const severity = log.severity;
      if (!severityCounts[severity]) {
        severityCounts[severity] = 0;
      }
      severityCounts[severity]++;
    });

    // 차트 데이터 변환
    const data = Object.entries(severityCounts).map(([name, value]) => ({
      name,
      value,
    }));

    return data;
  }, [logs]);

  // 심각도별 색상 매핑
  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "ERROR":
        return "#fc8452";
      case "FATAL":
        return "#ea7ccc";
      case "WARN":
      case "WARNING":
        return "#ffcd56";
      case "INFO":
        return "#5470c6";
      case "DEBUG":
        return "#91cc75";
      case "TRACE":
        return "#73c0de";
      default:
        return "#91cc75";
    }
  };

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
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: 10,
        data: chartData.map((item) => item.name),
      },
      series: [
        {
          name: "심각도",
          type: "pie",
          radius: ["50%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: isDark ? "#222" : "#fff",
            borderWidth: 2,
          },
          label: {
            show: false,
            position: "center",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: "18",
              fontWeight: "bold",
            },
          },
          labelLine: {
            show: false,
          },
          data: chartData.map((item) => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: getSeverityColor(item.name),
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

export default LogSeverityChart;
