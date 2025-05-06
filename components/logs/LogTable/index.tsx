// components/logs/LogTable/index.tsx
"use client";

import React from "react";
import { TableRow, TableCell } from "@heroui/table";
import { Tooltip } from "@heroui/tooltip";
import { Chip } from "@heroui/chip";

// 중앙화된 공유 컴포넌트 가져오기
import {
  BaseTable,
  TimeDisplay,
  SeverityBadge,
  CopyButton,
  ViewButton,
} from "@/components/shared";

interface LogTableProps {
  logs: LogItem[];
  isLoading?: boolean;
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelectLog: (log: LogItem) => void;
  pageSize: number;
}

const LogTable: React.FC<LogTableProps> = ({
  logs,
  isLoading = false,
  totalCount,
  currentPage,
  onPageChange,
  onSelectLog,
  pageSize,
}) => {
  const columns = [
    { key: "time", label: "Time" },
    { key: "service", label: "Service" },
    { key: "severity", label: "Severity" },
    { key: "message", label: "Message", className: "w-5/12" },
    { key: "trace", label: "Trace" },
    { key: "actions", label: "Actions", align: "center" as const },
  ];

  return (
    <BaseTable
      items={logs}
      columns={columns}
      isLoading={isLoading}
      emptyContent="로그 데이터가 없습니다."
      pagination={{
        totalCount,
        currentPage,
        pageSize,
        onPageChange,
      }}
      tableProps={{
        "aria-label": "Log list",
      }}
      renderRow={(log) => (
        <TableRow key={log.id} className="cursor-pointer hover:">
          <TableCell>
            <TimeDisplay timestamp={log.timestamp} />
          </TableCell>
          <TableCell>
            <Chip color="primary" variant="flat">
              {log.serviceName}
            </Chip>
          </TableCell>
          <TableCell>
            <SeverityBadge severity={log.severity} />
          </TableCell>
          <TableCell>
            <Tooltip content={log.message}>
              <div className="truncate max-w-md">{log.message}</div>
            </Tooltip>
          </TableCell>
          <TableCell>
            {log.traceId ? (
              <div className="flex items-center">
                <span className="font-mono text-xs truncate max-w-[100px]">
                  {log.traceId.substring(0, 8)}...
                </span>
                <CopyButton
                  text={log.traceId}
                  label="Trace ID"
                  tooltipContent="Trace ID 복사"
                  iconSize={14}
                  buttonProps={{ className: "ml-1" }}
                />
              </div>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </TableCell>
          <TableCell>
            <div className="flex justify-center">
              <ViewButton onPress={() => onSelectLog(log)} />
            </div>
          </TableCell>
        </TableRow>
      )}
    />
  );
};

export default LogTable;
