"use client";
import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { Card, CardBody } from "@heroui/card";

import { ServiceMetric } from "@/lib/store/telemetryStore";

interface ServiceMapProps {
  services: ServiceMetric[];
  height?: number | string;
  onSelectService?: (serviceName: string) => void;
}

interface ServiceNode {
  name: string;
  value: number;
  symbolSize: number;
  category: number;
  itemStyle?: {
    color: string;
  };
  label?: {
    show: boolean;
  };
}

interface ServiceLink {
  source: string;
  target: string;
  value: number;
  lineStyle?: {
    width: number;
    color?: string;
  };
}

const ServiceMap: React.FC<ServiceMapProps> = ({
  services,
  height = 600,
  onSelectService,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || services.length === 0) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    const chart = echarts.init(chartRef.current);

    chartInstanceRef.current = chart;

    // 서비스를 노드로 변환
    const nodes: ServiceNode[] = services.map((service, index) => {
      // 오류율에 따른 색상 결정
      let color = "#52c41a"; // 녹색 (정상)

      if (service.errorRate > 0) {
        if (service.errorRate < 5)
          color = "#1890ff"; // 파란색 (약간의 오류)
        else if (service.errorRate < 10)
          color = "#faad14"; // 노란색 (주의 필요)
        else color = "#ff4d4f"; // 빨간색 (심각한 오류)
      }

      // 트래픽에 따른 크기 결정
      const size = Math.max(30, Math.min(70, 30 + service.requestCount / 100));

      return {
        name: service.name,
        value: service.requestCount,
        symbolSize: size,
        category: 0, // 모든 서비스는 같은 카테고리
        itemStyle: {
          color,
        },
        label: {
          show: true,
        },
      };
    });

    // 서비스 간 가상 연결 생성 (실제 데이터에서는 트레이스 분석을 통해 결정)
    const links: ServiceLink[] = [];

    // 임의의 연결 생성 (실제 구현에서는 트레이스 분석 데이터를 사용해야 함)
    if (services.length > 1) {
      // 첫 번째 서비스를 중심 노드로 설정
      const centralService = services[0].name;

      // 다른 서비스들을 중심 노드에 연결
      for (let i = 1; i < services.length; i++) {
        links.push({
          source: centralService,
          target: services[i].name,
          value: Math.floor(Math.random() * 100) + 1, // 임의의 값
          lineStyle: {
            width: Math.floor(Math.random() * 5) + 1, // 임의의 선 굵기
          },
        });

        // 추가 연결 (일부 서비스들 간의 직접 연결)
        if (i < services.length - 1 && Math.random() > 0.5) {
          links.push({
            source: services[i].name,
            target: services[i + 1].name,
            value: Math.floor(Math.random() * 50) + 1,
            lineStyle: {
              width: Math.floor(Math.random() * 3) + 1,
            },
          });
        }
      }
    }

    const option: echarts.EChartsOption = {
      title: {
        text: "서비스 맵",
        subtext: `총 ${services.length}개 서비스`,
        top: "top",
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: function (params: any) {
          if (params.dataType === "node") {
            const service = services.find((s) => s.name === params.name);

            if (service) {
              return `
                <div style="font-weight: bold; margin-bottom: 5px;">${service.name}</div>
                <div>요청 수: ${service.requestCount.toLocaleString()}</div>
                <div>평균 응답 시간: ${service.avgLatency.toFixed(2)}ms</div>
                <div>오류율: ${service.errorRate.toFixed(2)}%</div>
                <div>p95 응답 시간: ${service.p95Latency.toFixed(2)}ms</div>
              `;
            }

            return params.name;
          }
          if (params.dataType === "edge") {
            return `${params.data.source} → ${params.data.target}`;
          }

          return "";
        },
      },
      legend: {
        show: false,
      },
      animationDuration: 1500,
      animationEasingUpdate: "quinticInOut",
      series: [
        {
          name: "서비스 맵",
          type: "graph",
          layout: "force",
          data: nodes,
          links: links,
          categories: [{ name: "서비스" }],
          roam: true,
          label: {
            position: "right",
            formatter: "{b}",
          },
          force: {
            repulsion: 200,
            gravity: 0.1,
            edgeLength: 150,
          },
          emphasis: {
            focus: "adjacency",
            lineStyle: {
              width: 4,
            },
          },
        },
      ],
    };

    chart.setOption(option);

    // 노드 클릭 이벤트 처리
    chart.on("click", function (params) {
      if (params.dataType === "node" && onSelectService) {
        onSelectService(params.name);
      }
    });

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [services, onSelectService]);

  return (
    <Card className="bg-white">
      <h2>
        <h2>서비스 의존성 맵</h2>
      </h2>
      <CardBody>
        {services.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">서비스 데이터가 없습니다.</p>
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

export default ServiceMap;
