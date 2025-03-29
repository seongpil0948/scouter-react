"use client";
import React from "react";
import { Badge } from "@heroui/badge";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardBody } from "@heroui/card";

import { ServiceMetric } from "@/lib/store/telemetryStore";

interface ServiceHealthWidgetProps {
  services: ServiceMetric[];
  isLoading?: boolean;
}

const ServiceHealthWidget: React.FC<ServiceHealthWidgetProps> = ({
  services,
  isLoading = false,
}) => {
  // 서비스 상태 별 분류
  const healthyServices = services.filter((s) => s.errorRate === 0);
  const warningServices = services.filter(
    (s) => s.errorRate > 0 && s.errorRate < 5,
  );
  const criticalServices = services.filter((s) => s.errorRate >= 5);

  // 상태에 따른 배지 스타일
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500">정상</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500">주의</Badge>;
      case "critical":
        return <Badge className="bg-red-500">위험</Badge>;
      default:
        return <Badge className="bg-gray-500">알 수 없음</Badge>;
    }
  };

  return (
    <Card className="bg-white">
      <h2 className="pb-2">
        <h2 className="text-lg font-medium">서비스 상태</h2>
      </h2>
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>등록된 서비스가 없습니다</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-1 bg-green-50 text-green-800 px-3 py-1 rounded-full">
                <CheckCircle size={16} />
                <span className="font-medium">{healthyServices.length}</span>
                <span>정상</span>
              </div>
              <div className="flex items-center gap-1 bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full">
                <AlertCircle size={16} />
                <span className="font-medium">{warningServices.length}</span>
                <span>주의</span>
              </div>
              <div className="flex items-center gap-1 bg-red-50 text-red-800 px-3 py-1 rounded-full">
                <AlertTriangle size={16} />
                <span className="font-medium">{criticalServices.length}</span>
                <span>위험</span>
              </div>
            </div>

            <div className="divide-y">
              {criticalServices.length > 0 && (
                <div className="py-2">
                  <h3 className="text-sm font-medium text-red-600 mb-2 flex items-center">
                    <AlertTriangle className="mr-1" size={16} />
                    위험 상태 서비스
                  </h3>
                  <ul className="space-y-1">
                    {criticalServices.map((service) => (
                      <li
                        key={service.name}
                        className="flex justify-between items-center"
                      >
                        <Link
                          className="text-blue-600 hover:underline"
                          href={`/services/${encodeURIComponent(service.name)}`}
                        >
                          {service.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          <span>{service.errorRate.toFixed(2)}%</span>
                          {getStatusBadge("critical")}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {warningServices.length > 0 && (
                <div className="py-2">
                  <h3 className="text-sm font-medium text-yellow-600 mb-2 flex items-center">
                    <AlertCircle className="mr-1" size={16} />
                    주의 필요 서비스
                  </h3>
                  <ul className="space-y-1">
                    {warningServices.map((service) => (
                      <li
                        key={service.name}
                        className="flex justify-between items-center"
                      >
                        <Link
                          className="text-blue-600 hover:underline"
                          href={`/services/${encodeURIComponent(service.name)}`}
                        >
                          {service.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          <span>{service.errorRate.toFixed(2)}%</span>
                          {getStatusBadge("warning")}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {healthyServices.length > 0 && (
                <div className="py-2">
                  <h3 className="text-sm font-medium text-green-600 mb-2 flex items-center">
                    <CheckCircle className="mr-1" size={16} />
                    정상 서비스
                  </h3>
                  <ul className="space-y-1">
                    {healthyServices.slice(0, 5).map((service) => (
                      <li
                        key={service.name}
                        className="flex justify-between items-center"
                      >
                        <Link
                          className="text-blue-600 hover:underline"
                          href={`/services/${encodeURIComponent(service.name)}`}
                        >
                          {service.name}
                        </Link>
                        <div>{getStatusBadge("healthy")}</div>
                      </li>
                    ))}
                    {healthyServices.length > 5 && (
                      <li className="text-center text-gray-500 text-sm">
                        +{healthyServices.length - 5}개 더...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default ServiceHealthWidget;
