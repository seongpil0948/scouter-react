"use client";
import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Badge } from "@heroui/badge";
import { Clock, AlertCircle, Server, GitBranch } from "lucide-react";
import Link from "next/link";

import { TraceItem } from "@/lib/store/telemetryStore";

interface TraceSummaryProps {
  trace: TraceItem;
  showServices?: boolean;
}

const TraceSummary: React.FC<TraceSummaryProps> = ({
  trace,
  showServices = true,
}) => {
  // 지연 시간 포맷팅
  const formatDuration = (duration: number) => {
    if (duration < 1) return "<1ms";
    if (duration < 1000) return `${duration.toFixed(2)}ms`;

    return `${(duration / 1000).toFixed(2)}s`;
  };

  // 시간 포맷팅
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // 상태에 따른 배지 색상
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ERROR":
        return <Badge className="bg-red-500">오류</Badge>;
      case "OK":
        return <Badge className="bg-green-500">성공</Badge>;
      default:
        return <Badge className="bg-gray-500">미설정</Badge>;
    }
  };

  // 지연 시간에 따른 색상
  const getLatencyColor = (duration: number) => {
    if (duration < 50) return "text-green-600";
    if (duration < 200) return "text-blue-600";
    if (duration < 500) return "text-yellow-600";

    return "text-red-600";
  };

  return (
    <Card className="bg-white">
      <h2 className="pb-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium truncate">{trace.name}</h2>
          {getStatusBadge(trace.status)}
        </div>
        <p className="text-sm text-gray-500">
          트레이스 ID:{" "}
          <span className="font-mono">{trace.traceId.substring(0, 8)}...</span>
        </p>
      </h2>
      <CardBody>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="text-gray-500" size={16} />
            <div>
              <p className="text-xs text-gray-500">시작 시간</p>
              <p className="text-sm font-medium">
                {formatTime(trace.startTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className={`${getLatencyColor(trace.duration)}`} size={16} />
            <div>
              <p className="text-xs text-gray-500">지연 시간</p>
              <p
                className={`text-sm font-medium ${getLatencyColor(trace.duration)}`}
              >
                {formatDuration(trace.duration)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Server className="text-gray-500" size={16} />
            <div>
              <p className="text-xs text-gray-500">서비스</p>
              <p className="text-sm font-medium">{trace.serviceName}</p>
            </div>
          </div>

          {trace.spanCount !== undefined && (
            <div className="flex items-center gap-2">
              <GitBranch className="text-gray-500" size={16} />
              <div>
                <p className="text-xs text-gray-500">스팬 수</p>
                <p className="text-sm font-medium">{trace.spanCount}</p>
              </div>
            </div>
          )}
        </div>

        {showServices && trace.services && trace.services.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">관련 서비스</p>
            <div className="flex flex-wrap gap-2">
              {trace.services.map((service) => (
                <Link
                  key={service}
                  href={`/services/${encodeURIComponent(service)}`}
                >
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">
                    {service}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {trace.status === "ERROR" && (
          <div className="mt-4 p-2 bg-red-50 text-red-800 rounded-md flex items-start gap-2">
            <AlertCircle className="mt-0.5" size={16} />
            <div>
              <p className="font-medium">트레이스 실행 중 오류 발생</p>
              <p className="text-sm">
                세부 정보는 트레이스 상세 페이지를 확인하세요.
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default TraceSummary;
