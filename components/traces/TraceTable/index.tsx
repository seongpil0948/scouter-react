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
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Pagination } from "@heroui/pagination";
import { Tooltip } from "@heroui/tooltip";
import { Chip, ChipProps } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Card, CardBody } from "@heroui/card";
import {
  Eye as EyeIcon,
  Clock,
  Share2,
  AlertTriangle,
  Check,
  HelpCircle,
  Database,
  Globe,
} from "lucide-react";

import {
  formatDateTime,
  formatDuration,
  formatRelativeTime,
} from "@/lib/utils/dateFormatter";

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
  // Status color determination
  const getStatusColor = useCallback((status?: string) => {
    switch (status) {
      case "ERROR":
        return "danger";
      case "OK":
        return "success";
      default:
        return "default";
    }
  }, []);

  // Status icon rendering
  const renderStatusIcon = useCallback((status?: string) => {
    switch (status) {
      case "ERROR":
        return <AlertTriangle className="mr-1" size={14} />;
      case "OK":
        return <Check className="mr-1" size={14} />;
      default:
        return <HelpCircle className="mr-1" size={14} />;
    }
  }, []);

  // SQL attributes check for highlighting
  const hasSqlAttributes = useCallback((trace: TraceItem) => {
    if (!trace.attributes) return false;

    return Object.keys(trace.attributes).some(
      (key) =>
        key.startsWith("sql.") ||
        key === "db.statement" ||
        key === "db.operation"
    );
  }, []);

  // Calculate total page count
  const pageCount = Math.ceil(totalCount / pageSize);

  return (
    <Card className="w-full">
      <CardBody className="p-0">
        <Table
          aria-label="Trace list"
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
            <TableColumn key="name" className="w-4/12">
              Name
            </TableColumn>
            <TableColumn key="status">Status</TableColumn>
            <TableColumn key="duration">Latency</TableColumn>
            <TableColumn key="actions" align="center">
              Details
            </TableColumn>
          </TableHeader>
          <TableBody
            emptyContent={
              <div className="py-8 text-center text-gray-500">
                {isLoading ? "Loading data..." : "No trace data available."}
              </div>
            }
            items={traces}
            isLoading={isLoading}
            loadingContent={<Spinner />}
          >
            {(trace) => {
              const sqlAttrs = hasSqlAttributes(trace);

              return (
                <TableRow
                  key={trace.id}
                  className={`cursor-pointer hover:bg-gray-50 ${sqlAttrs ? "border-l-4 border-l-indigo-500" : ""}`}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{formatDateTime(trace.startTime)}</span>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(trace.startTime)}
                      </span>
                    </div>
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
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(trace.attributes)
                            .filter(
                              ([key]) =>
                                key.startsWith("sql.") ||
                                key.startsWith("http.") ||
                                key.includes("error")
                            )
                            .slice(0, 2)
                            .map(([key, value]) => {
                              const isSQL =
                                key.startsWith("sql.") ||
                                key === "db.statement";
                              const isHTTP =
                                key.startsWith("http.") ||
                                key.startsWith("url.");
                              const isError = key.includes("error");

                              let chipColor: ChipProps["color"] = "default";
                              let icon = null;

                              if (isSQL) {
                                chipColor = "secondary";
                                icon = <Database size={12} className="mr-1" />;
                              } else if (isHTTP) {
                                chipColor = "primary";
                                icon = <Globe size={12} className="mr-1" />;
                              } else if (isError) {
                                chipColor = "danger";
                                icon = (
                                  <AlertTriangle size={12} className="mr-1" />
                                );
                              }

                              const displayValue =
                                String(value).substring(0, 15) +
                                (String(value).length > 15 ? "..." : "");

                              return (
                                <Chip
                                  key={key}
                                  size="sm"
                                  variant="flat"
                                  color={chipColor}
                                  className="text-xs flex items-center"
                                >
                                  {icon}
                                  {key.split(".").pop()}: {displayValue}
                                </Chip>
                              );
                            })}

                          {Object.keys(trace.attributes).length > 2 && (
                            <Chip size="sm" variant="flat" className="text-xs">
                              +{Object.keys(trace.attributes).length - 2}
                            </Chip>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      color={getStatusColor(trace.status)}
                      className="flex items-center"
                    >
                      {renderStatusIcon(trace.status)}
                      {trace.status || "UNSET"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="mr-1 text-gray-500" size={14} />
                      <span title={`${trace.duration}ms`}>
                        {formatDuration(trace.duration)}
                      </span>
                      {sqlAttrs &&
                        trace.attributes &&
                        trace.attributes["sql.elapsed"] && (
                          <Tooltip
                            content={`SQL execution time: ${formatDuration(Number(trace.attributes["sql.elapsed"]))}`}
                          >
                            <Badge
                              variant="flat"
                              color="secondary"
                              className="ml-2 text-xs"
                            >
                              <Database size={10} className="mr-1" />
                              {formatDuration(
                                Number(trace.attributes["sql.elapsed"])
                              )}
                            </Badge>
                          </Tooltip>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Tooltip content="View details">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => onSelectTrace(trace)}
                        >
                          <EyeIcon size={16} />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Copy trace ID">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            navigator.clipboard.writeText(trace.traceId);
                          }}
                        >
                          <Share2 size={16} />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );
};

export default TraceTable;
