// components/logs/LogTable/index.tsx
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
import { Pagination } from "@heroui/pagination";
import { Tooltip } from "@heroui/tooltip";
import { Spinner } from "@heroui/spinner";
import { Card, CardBody } from "@heroui/card";
import {
  Eye as EyeIcon,
  Activity,
  Share2,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
} from "lucide-react";

import { formatDateTime, formatRelativeTime } from "@/lib/utils/dateFormatter";
import { Chip } from "@heroui/chip";

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
  // Severity color and icon
  const getSeverityColor = useCallback((severity?: string) => {
    switch (severity?.toUpperCase()) {
      case "ERROR":
      case "FATAL":
        return "danger";
      case "WARN":
      case "WARNING":
        return "warning";
      case "INFO":
        return "primary";
      case "DEBUG":
        return "secondary";
      case "TRACE":
        return "default";
      default:
        return "default";
    }
  }, []);

  // Severity icon
  const renderSeverityIcon = useCallback((severity?: string) => {
    switch (severity?.toUpperCase()) {
      case "ERROR":
      case "FATAL":
        return <AlertTriangle className="mr-1" size={14} />;
      case "WARN":
      case "WARNING":
        return <AlertTriangle className="mr-1" size={14} />;
      case "INFO":
        return <Info className="mr-1" size={14} />;
      case "DEBUG":
        return <Activity className="mr-1" size={14} />;
      case "TRACE":
        return <CheckCircle className="mr-1" size={14} />;
      default:
        return <Info className="mr-1" size={14} />;
    }
  }, []);

  // Calculate total page count
  const pageCount = Math.ceil(totalCount / pageSize);

  // Copy trace ID
  const handleCopyTraceId = useCallback((traceId: string) => {
    navigator.clipboard.writeText(traceId);
  }, []);

  return (
    <Card className="w-full">
      <CardBody className="p-0">
        <Table
          aria-label="Log list"
          isHeaderSticky
          removeWrapper
          classNames={{
            base: "max-w-full",
            th: [
              "bg-default-100",
              "text-default-800",
              "border-b",
              "border-divider",
              "px-4",
              "py-3",
              "text-sm",
            ],
            td: ["p-4", "text-sm"],
          }}
          bottomContent={
            pageCount > 1 ? (
              <div className="flex justify-center py-4">
                <Pagination
                  showControls
                  showShadow
                  color="primary"
                  page={currentPage}
                  total={pageCount}
                  onChange={onPageChange}
                />
              </div>
            ) : null
          }
        >
          <TableHeader>
            <TableColumn key="time">Time</TableColumn>
            <TableColumn key="service">Service</TableColumn>
            <TableColumn key="severity">Severity</TableColumn>
            <TableColumn key="message" className="w-5/12">
              Message
            </TableColumn>
            <TableColumn key="trace">Trace</TableColumn>
            <TableColumn key="actions" align="center">
              Actions
            </TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              <div className="py-8 text-center text-gray-500">
                {isLoading ? "Loading data..." : "No log data available."}
              </div>
            }
            items={logs}
            isLoading={isLoading}
            loadingContent={<Spinner />}
          >
            {(log) => (
              <TableRow key={log.id} className="cursor-pointer hover:">
                <TableCell>
                  <div className="flex flex-col">
                    <span>{formatDateTime(log.timestamp)}</span>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(log.timestamp)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip color="primary" variant="flat">
                    {log.serviceName}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip color={getSeverityColor(log.severity)} variant="flat">
                    {renderSeverityIcon(log.severity)}
                    {log.severity}
                  </Chip>
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
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="ml-1"
                        onPress={() => handleCopyTraceId(log.traceId!)}
                      >
                        <Share2 size={14} />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onSelectLog(log)}
                    >
                      <EyeIcon size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
};

export default LogTable;
