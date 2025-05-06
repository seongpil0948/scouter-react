"use client";

import React, { useCallback } from "react";
import { TableRow, TableCell } from "@heroui/table";
import { Badge } from "@heroui/badge";
import { Tooltip } from "@heroui/tooltip";
import { Database } from "lucide-react";

// 중앙화된 공유 컴포넌트 가져오기
import {
  BaseTable,
  TimeDisplay,
  StatusBadge,
  DurationDisplay,
  AttributeChips,
  CopyButton,
  ViewButton
} from "@/components/shared";

interface TraceTableProps {
  traces: TraceItem[];
  isLoading?: boolean;
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelectTrace: (trace: TraceItem) => void;
  pageSize: number;
}

const TraceTable: React.FC<TraceTableProps> = ({
  traces,
  isLoading = false,
  totalCount,
  currentPage,
  onPageChange,
  onSelectTrace,
  pageSize,
}) => {
  // SQL 속성 확인 함수
  const hasSqlAttributes = useCallback((trace: TraceItem) => {
    if (!trace.attributes) return false;

    return Object.keys(trace.attributes).some(
      (key) =>
        key.startsWith("sql.") ||
        key === "db.statement" ||
        key === "db.operation"
    );
  }, []);

  const columns = [
    { key: "time", label: "Time" },
    { key: "service", label: "Service" },
    { key: "name", label: "Name", className: "w-4/12" },
    { key: "status", label: "Status" },
    { key: "duration", label: "Latency" },
    { key: "actions", label: "Details", align: "center" as const },
  ];

  return (
    <BaseTable
      items={traces}
      columns={columns}
      isLoading={isLoading}
      emptyContent="트레이스 데이터가 없습니다."
      pagination={{
        totalCount,
        currentPage,
        pageSize,
        onPageChange,
      }}
      tableProps={{
        "aria-label": "Trace list",
      }}
      renderRow={(trace) => {
        const sqlAttrs = hasSqlAttributes(trace);

        return (
          <TableRow
            key={trace.id}
            className={`cursor-pointer hover: ${sqlAttrs ? "border-l-4 border-l-indigo-500" : ""}`}
          >
            <TableCell>
              <TimeDisplay timestamp={trace.startTime} />
            </TableCell>
            <TableCell>
              <Badge color="primary" variant="flat">
                {trace.serviceName}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <Tooltip content={trace.name}>
                  <div className="font-mono text-sm cursor-help truncate">
                    {trace.name.length > 40
                      ? `${trace.name.substring(0, 40)}...`
                      : trace.name}
                  </div>
                </Tooltip>

                {trace.attributes && (
                  <AttributeChips
                    attributes={trace.attributes}
                    className="mt-1"
                    maxDisplay={2}
                  />
                )}
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={trace.status} variant="badge" />
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                <DurationDisplay duration={trace.duration} />
                {sqlAttrs &&
                  trace.attributes &&
                  trace.attributes["sql.elapsed"] && (
                    <Tooltip
                      content={`SQL 실행 시간: ${trace.attributes["sql.elapsed"]}ms`}
                    >
                      <Badge
                        variant="flat"
                        color="secondary"
                        className="ml-2 text-xs"
                      >
                        <Database size={10} className="mr-1" />
                        {trace.attributes["sql.elapsed"]}ms
                      </Badge>
                    </Tooltip>
                  )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex justify-center gap-2">
                <ViewButton 
                  onPress={() => onSelectTrace(trace)} 
                  tooltipContent="상세 보기"
                />
                <CopyButton 
                  text={trace.traceId} 
                  label="Trace ID" 
                  tooltipContent="Trace ID 복사"
                />
              </div>
            </TableCell>
          </TableRow>
        );
      }}
    />
  );
};

export default TraceTable;
