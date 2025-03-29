"use client";
import React from "react";
import { Clock } from "lucide-react";
import Link from "next/link";
import { Card, CardBody } from "@heroui/card";

import { ServiceMetric } from "@/lib/store/telemetryStore";

interface TopLatencyWidgetProps {
  services: ServiceMetric[];
  isLoading?: boolean;
  limit?: number;
}

const TopLatencyWidget: React.FC<TopLatencyWidgetProps> = ({
  services,
  isLoading = false,
  limit = 5,
}) => {
  // 지연 시간으로 정렬된 서비스
  const sortedServices = [...services]
    .sort((a, b) => b.avgLatency - a.avgLatency)
    .slice(0, limit);

  // 지연 시간 포맷팅
  const formatDuration = (duration: number) => {
    if (duration < 1) return "<1ms";
    if (duration < 1000) return `${duration.toFixed(2)}ms`;

    return `${(duration / 1000).toFixed(2)}s`;
  };

  // 지연 시간에 따른 색상 계산
  const getLatencyColor = (latency: number) => {
    if (latency < 50) return "text-green-600";
    if (latency < 200) return "text-blue-600";
    if (latency < 500) return "text-yellow-600";

    return "text-red-600";
  };

  // 최대 지연 시간 계산 (차트 스케일링용)
  const maxLatency =
    sortedServices.length > 0
      ? Math.max(...sortedServices.map((s) => s.avgLatency))
      : 100;

  return (
    <Card className="bg-white">
      <div className="pb-2">
        <h2 className="text-lg font-medium">지연 시간 상위 서비스</h2>
      </div>
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : sortedServices.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>서비스 데이터가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedServices.map((service) => (
              <div key={service.name} className="relative">
                <div className="flex justify-between items-center mb-1">
                  <Link
                    className="text-blue-600 hover:underline font-medium"
                    href={`/services/${encodeURIComponent(service.name)}`}
                  >
                    {service.name}
                  </Link>
                  <div className="flex items-center gap-1">
                    <Clock className="text-gray-500" size={16} />
                    <span className={getLatencyColor(service.avgLatency)}>
                      {formatDuration(service.avgLatency)}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${service.avgLatency > 500 ? "bg-red-500" : service.avgLatency > 200 ? "bg-yellow-500" : "bg-blue-500"}`}
                    style={{
                      width: `${Math.min(100, (service.avgLatency / maxLatency) * 100)}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>p95: {formatDuration(service.p95Latency)}</span>
                  <span>p99: {formatDuration(service.p99Latency)}</span>
                </div>
              </div>
            ))}

            <div className="pt-2 text-right">
              <Link
                className="text-sm text-blue-600 hover:underline"
                href="/services"
              >
                모든 서비스 보기
              </Link>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default TopLatencyWidget;
