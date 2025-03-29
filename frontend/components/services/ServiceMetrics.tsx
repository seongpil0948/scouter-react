"use client";
import React, { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";

import { ServiceMetric } from "@/lib/store/telemetryStore";

interface ServiceMetricsProps {
  service: ServiceMetric;
  height?: number | string;
}

const ServiceMetrics: React.FC<ServiceMetricsProps> = ({
  service,
  height = 350,
}) => {
  const [activeTab, setActiveTab] = useState("latency");
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // 지연 시간 포맷팅
  const formatDuration = (duration: number) => {
    if (duration < 1) return "<1ms";
    if (duration < 1000) return `${duration.toFixed(2)}ms`;

    return `${(duration / 1000).toFixed(2)}s`;
  };

  // 차트 렌더링
  useEffect(() => {
    if (!chartRef.current) return;

    // 기존 차트 인스턴스 정리
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    // 새 차트 인스턴스 생성
    const chart = echarts.init(chartRef.current);

    chartInstanceRef.current = chart;

    // 시간 데이터 포인트 준비
    const timeData = service.timeSeriesData || [];
    const timestamps = timeData.map((point) =>
      new Date(point.timestamp).toLocaleTimeString(),
    );

    let option: echarts.EChartsOption;

    if (activeTab === "latency") {
      // 지연 시간 차트 옵션
      option = {
        tooltip: {
          trigger: "axis",
          formatter: function (params: any) {
            const time = params[0].axisValue;
            const latency = params[0].data;

            return `${time}<br/>응답 시간: <strong>${formatDuration(latency)}</strong>`;
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: timestamps,
          axisLabel: {
            rotate: 45,
          },
        },
        yAxis: {
          type: "value",
          name: "응답 시간 (ms)",
          min: 0,
        },
        series: [
          {
            name: "평균 응답 시간",
            type: "line",
            data: timeData.map((point) => point.avgLatency),
            smooth: true,
            showSymbol: false,
            lineStyle: {
              width: 3,
              color: "#1890ff",
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(24, 144, 255, 0.4)" },
                { offset: 1, color: "rgba(24, 144, 255, 0.1)" },
              ]),
            },
          },
        ],
      };
    } else if (activeTab === "traffic") {
      // 트래픽 차트 옵션
      option = {
        tooltip: {
          trigger: "axis",
          formatter: function (params: any) {
            const time = params[0].axisValue;
            const count = params[0].data;

            return `${time}<br/>요청 수: <strong>${count}</strong>`;
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: timestamps,
          axisLabel: {
            rotate: 45,
          },
        },
        yAxis: {
          type: "value",
          name: "요청 수",
          min: 0,
        },
        series: [
          {
            name: "요청 수",
            type: "bar",
            data: timeData.map((point) => point.requestCount),
            itemStyle: {
              color: "#52c41a",
            },
          },
        ],
      };
    } else {
      // 오류율 차트 옵션
      option = {
        tooltip: {
          trigger: "axis",
          formatter: function (params: any) {
            const time = params[0].axisValue;
            const errorCount = params[0].data;
            const errorRate = params[1].data;

            return `${time}<br/>오류 수: <strong>${errorCount}</strong><br/>오류율: <strong>${errorRate.toFixed(2)}%</strong>`;
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: timestamps,
          axisLabel: {
            rotate: 45,
          },
        },
        yAxis: [
          {
            type: "value",
            name: "오류 수",
            min: 0,
            position: "left",
          },
          {
            type: "value",
            name: "오류율 (%)",
            min: 0,
            max: 100,
            position: "right",
          },
        ],
        series: [
          {
            name: "오류 수",
            type: "bar",
            data: timeData.map((point) => point.errorCount),
            itemStyle: {
              color: "#ff4d4f",
            },
          },
          {
            name: "오류율",
            type: "line",
            yAxisIndex: 1,
            data: timeData.map((point) => point.errorRate),
            smooth: true,
            showSymbol: false,
            lineStyle: {
              width: 3,
              color: "#faad14",
            },
          },
        ],
      };
    }

    // 차트 렌더링
    chart.setOption(option);

    // 윈도우 크기 변경 시 차트 리사이징
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [service, activeTab]);

  return (
    <Card className="bg-white">
      <h2 className="pb-0">
        <h2 className="text-xl font-semibold">{service.name} 메트릭</h2>
        <Tabs
          className="w-full"
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
        >
          <Tab key="latency" title="응답 시간" />
          <Tab key="traffic" title="트래픽" />
          <Tab key="errors" title="오류" />
        </Tabs>
      </h2>

      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">평균 응답 시간</p>
            <p className="text-2xl font-bold">
              {formatDuration(service.avgLatency)}
            </p>
            <p className="text-xs text-gray-500">
              p95: {formatDuration(service.p95Latency)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">요청 수</p>
            <p className="text-2xl font-bold">
              {service.requestCount.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">오류율</p>
            <p className="text-2xl font-bold">
              {service.errorRate.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500">
              총 {service.errorCount}개 오류
            </p>
          </div>
        </div>

        <div
          ref={chartRef}
          style={{
            height: typeof height === "number" ? `${height}px` : height,
            width: "100%",
          }}
        />

        {(!service.timeSeriesData || service.timeSeriesData.length === 0) && (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">시계열 데이터가 없습니다.</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default ServiceMetrics;
