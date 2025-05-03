"use client";
import React from "react";
import { Badge } from "@heroui/badge";
import { Card, CardBody } from "@heroui/card";
import { Tooltip } from "@heroui/tooltip";
import { Chip } from "@heroui/chip";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

import { formatDateTime } from "@/lib/utils/dateFormatter";

interface TraceSummaryProps {
  traceData: TraceDetailData["trace"];
  formatTime: (timestamp: number) => string;
  formatDuration: (duration: number) => string;
}

export const TraceSummary: React.FC<TraceSummaryProps> = React.memo(
  ({ traceData, formatTime, formatDuration }) => {
    const d = traceData;
    console.log("TraceSummary", d);
    const errorCount = d.spans.filter((span) => span.status === "ERROR").length;

    return (
      <Card className="mb-4">
        <CardBody className="p-4">
          <Table aria-label="트레이스 요약" removeWrapper>
            <TableHeader>
              <TableColumn>항목</TableColumn>
              <TableColumn>값</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-gray-500 w-1/4">
                  트레이스 ID
                </TableCell>
                <TableCell className="font-mono">
                  {d.traceId.substring(0, 8)}...
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-gray-500">시작 시간</TableCell>
                <TableCell className="font-mono">
                  {formatDateTime(d.startTime)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-gray-500">총 지연 시간</TableCell>
                <TableCell className="font-mono">
                  {formatDuration(d.endTime - d.startTime)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-gray-500">스팬 수</TableCell>
                <TableCell className="font-mono flex items-center">
                  {d.spans.length}
                  {errorCount > 0 && (
                    <Tooltip content={`${errorCount}개의 오류 스팬이 있습니다`}>
                      <Badge className="ml-2" color="danger">
                        {errorCount} 오류
                      </Badge>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-gray-500">서비스</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {traceData.services.map((service) => (
                      <Chip
                        key={service}
                        size="sm"
                        color="primary"
                        variant="flat"
                      >
                        {service}
                      </Chip>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    );
  }
);

TraceSummary.displayName = "TraceSummary";
