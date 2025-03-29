"use client";
import React, { useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import {
  ExternalLinkIcon,
  ActivityIcon,
  AlertTriangleIcon,
} from "lucide-react";
import Link from "next/link";
import { Card, CardBody } from "@heroui/card";

import { ServiceMetric } from "@/lib/store/telemetryStore";

interface ServiceListProps {
  services: ServiceMetric[];
  isLoading?: boolean;
  onSelectService?: (service: ServiceMetric) => void;
}

const ServiceList: React.FC<ServiceListProps> = ({
  services,
  isLoading = false,
  onSelectService,
}) => {
  // 지연 시간 포맷팅
  const formatDuration = useCallback((duration: number) => {
    if (duration < 1) {
      return "<1ms";
    }
    if (duration < 1000) {
      return `${duration.toFixed(2)}ms`;
    }

    return `${(duration / 1000).toFixed(2)}s`;
  }, []);

  // 오류율에 따른 배지 색상
  const getErrorRateBadge = useCallback((errorRate: number) => {
    if (errorRate === 0) return <Badge className="bg-green-500">완벽</Badge>;
    if (errorRate < 1)
      return <Badge className="bg-green-400">{errorRate.toFixed(2)}%</Badge>;
    if (errorRate < 5)
      return <Badge className="bg-yellow-500">{errorRate.toFixed(2)}%</Badge>;
    if (errorRate < 10)
      return <Badge className="bg-orange-500">{errorRate.toFixed(2)}%</Badge>;

    return <Badge className="bg-red-500">{errorRate.toFixed(2)}%</Badge>;
  }, []);

  // 상태 배지 계산
  const getHealthBadge = useCallback((service: ServiceMetric) => {
    if (service.errorRate === 0)
      return <Badge className="bg-green-500">정상</Badge>;
    if (service.errorRate < 5)
      return <Badge className="bg-green-400">양호</Badge>;
    if (service.errorRate < 10)
      return <Badge className="bg-yellow-500">주의</Badge>;
    if (service.errorRate < 20)
      return <Badge className="bg-orange-500">경고</Badge>;

    return <Badge className="bg-red-500">위험</Badge>;
  }, []);

  return (
    <Card>
      <CardBody className="p-0">
        <Table
          aria-label="서비스 목록 테이블"
          bottomContent={
            <TableRow>
              <TableCell className="text-right" colSpan={6}>
                총 {services.length}개 서비스
              </TableCell>
            </TableRow>
          }
        >
          <TableHeader>
            <TableRow>
              <TableColumn className="w-48">서비스명</TableColumn>
              <TableColumn className="w-24">상태</TableColumn>
              <TableColumn>트래픽</TableColumn>
              <TableColumn>응답 시간</TableColumn>
              <TableColumn>오류율</TableColumn>
              <TableColumn className="w-24">동작</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={6}>
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                  <p className="mt-2 text-gray-500">
                    서비스 정보를 불러오는 중...
                  </p>
                </TableCell>
              </TableRow>
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={6}>
                  <p className="text-gray-500">등록된 서비스가 없습니다.</p>
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow
                  key={service.name}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectService?.(service)}
                >
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{getHealthBadge(service)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <ActivityIcon className="mr-1 text-gray-500" size={16} />
                      {service.requestCount.toLocaleString()} req/min
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>평균: {formatDuration(service.avgLatency)}</span>
                      <span className="text-xs text-gray-500">
                        p95: {formatDuration(service.p95Latency)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <AlertTriangleIcon
                        className={
                          service.errorRate > 0
                            ? "mr-1 text-red-500"
                            : "mr-1 text-gray-500"
                        }
                        size={16}
                      />
                      {getErrorRateBadge(service.errorRate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      passHref
                      href={`/services/${encodeURIComponent(service.name)}`}
                    >
                      <Button variant="ghost">
                        <ExternalLinkIcon className="text-gray-600" size={18} />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
};

export default ServiceList;
