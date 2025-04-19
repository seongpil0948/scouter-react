"use client";
import React from "react";
import { Badge } from "@heroui/badge";
import { Card, CardBody } from "@heroui/card";
import { Tooltip } from "@heroui/tooltip";
import { Chip } from "@heroui/chip";

import { formatDateTime } from "@/lib/utils/dateFormatter";

interface TraceData {
  traceId: string;
  spans: any[];
  startTime: number;
  endTime: number;
  services: string[];
  total: number;
}

interface TraceSummaryProps {
  traceData: TraceData;
  formatTime: (timestamp: number) => string;
  formatDuration: (duration: number) => string;
}

export const TraceSummary: React.FC<TraceSummaryProps> = React.memo(
  ({ traceData, formatTime, formatDuration }) => {
    const errorCount = traceData.spans.filter(
      (span) => span.status === "ERROR",
    ).length;

    return (
      <Card className="mb-4">
        <CardBody className="p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-500">트레이스 ID:</span>
              <span className="font-mono ml-2">
                {traceData.traceId.substring(0, 8)}...
              </span>
            </div>
            <div>
              <span className="text-gray-500">시작 시간:</span>
              <span className="font-mono ml-2">
                {formatDateTime(traceData.startTime)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">총 지연 시간:</span>
              <span className="font-mono ml-2">
                {formatDuration(traceData.endTime - traceData.startTime)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">스팬 수:</span>
              <span className="font-mono ml-2">{traceData.spans.length}</span>
              {errorCount > 0 && (
                <Tooltip content={`${errorCount}개의 오류 스팬이 있습니다`}>
                  <Badge className="ml-2" color="danger">
                    {errorCount} 오류
                  </Badge>
                </Tooltip>
              )}
            </div>
            <div>
              <span className="text-gray-500">서비스:</span>
              <span className="ml-2 flex flex-wrap gap-1">
                {traceData.services.map((service) => (
                  <Chip key={service} size="sm" color="primary" variant="flat">
                    {service}
                  </Chip>
                ))}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  },
);

TraceSummary.displayName = "TraceSummary";