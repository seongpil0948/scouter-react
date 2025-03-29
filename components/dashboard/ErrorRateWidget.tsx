"use client";
import React, { useRef, useEffect } from "react";
import * as echarts from "echarts";
import { Card, CardBody } from "@heroui/card";

import { ServiceMetric } from "@/lib/store/telemetryStore";

interface ErrorRateWidgetProps {
  services: ServiceMetric[];
  isLoading?: boolean;
  height?: number | string;
}

const ErrorRateWidget: React.FC<ErrorRateWidgetProps> = ({
  services,
  isLoading = false,
  height = 300,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // 오류율 기준으로 정렬된 서비스 (상위 10개)
  const topErrorServices = [...services]
    .filter((s) => s.errorRate > 0) // 오류가 있는 서비스만
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 10);

  useEffect(() => {
    if (!chartRef.current || isLoading) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    const chart = echarts.init(chartRef.current);

    chartInstanceRef.current = chart;

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: function (params: any) {
          const data = params[0];

          return `
            <div style="font-weight: bold; margin-bottom: 5px;">${data.name}</div>
            <div>오류율: ${data.value}%</div>
            <div>요청 수: ${services.find((s) => s.name === data.name)?.requestCount.toLocaleString() || 0}</div>
            <div>오류 수: ${services.find((s) => s.name === data.name)?.errorCount.toLocaleString() || 0}</div>
          `;
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
        name: "오류율 (%)",
        axisLabel: {
          formatter: "{value}%",
        },
      },
      yAxis: {
        type: "category",
        data: topErrorServices.map((s) => s.name),
        axisLabel: {
          width: 100,
          overflow: "truncate",
          formatter: function (value: string) {
            return value.length > 15 ? value.slice(0, 12) + "..." : value;
          },
        },
      },
      series: [
        {
          name: "오류율",
          type: "bar",
          data: topErrorServices.map((s) => s.errorRate),
          itemStyle: {
            color: function (params: any) {
              const value = params.value;

              if (value < 1) return "#52c41a";
              if (value < 5) return "#1890ff";
              if (value < 10) return "#faad14";

              return "#ff4d4f";
            },
          },
          label: {
            show: true,
            position: "right",
            formatter: "{c}%",
          },
        },
      ],
    };

    chart.setOption(option);

    // 차트 크기 조정
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [services, isLoading, topErrorServices]);

  return (
    <Card className="bg-white">
      <h2 className="pb-2">
        <h2 className="text-lg font-medium">오류율 상위 서비스</h2>
      </h2>
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : topErrorServices.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-center">
            <div>
              <p className="text-green-600 font-medium mb-2">
                오류가 없습니다!
              </p>
              <p className="text-gray-500">
                모든 서비스가 정상적으로 동작 중입니다.
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={chartRef}
            style={{
              height: typeof height === "number" ? `${height}px` : height,
              width: "100%",
            }}
          />
        )}
      </CardBody>
    </Card>
  );
};

export default ErrorRateWidget;
