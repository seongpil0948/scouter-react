"use client";

import React, { useMemo } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Tooltip } from "@heroui/tooltip";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Link } from "@heroui/link";
import {
  Database,
  Globe,
  AlertTriangle,
  Clock,
  ChevronRight,
  Code,
  BarChart2,
  Filter,
} from "lucide-react";

import { analyzeTraceSpans } from "@/lib/utils/spanAnalyzer";
import { formatDuration } from "@/lib/utils/dateFormatter";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { Chip } from "@heroui/chip";

interface TraceAnalyticsSummaryProps {
  spans: Span[];
  onSelectSpan: (spanId: string) => void;
  onToggleView?: (view: string) => void;
}

const TraceAnalyticsSummary: React.FC<TraceAnalyticsSummaryProps> = ({
  spans,
  onSelectSpan,
  onToggleView,
}) => {
  // Analyze span data
  const analytics = useMemo(() => {
    return analyzeTraceSpans(spans);
  }, [spans]);

  // Sort services by count
  const sortedServices = useMemo(() => {
    return Object.entries(analytics.byService).sort(
      (a, b) => b[1].count - a[1].count
    );
  }, [analytics.byService]);

  // Get status code color
  const getStatusCodeColor = (code: string) => {
    if (code.startsWith("2")) return "success";
    if (code.startsWith("3")) return "warning";
    if (code.startsWith("4")) return "warning";
    if (code.startsWith("5")) return "danger";
    return "default";
  };

  // SQL tab content
  const renderSqlTab = () => {
    if (analytics.sql.count === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          No SQL related information found
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <CardBody className="p-4">
              <div className="text-sm text-gray-500">SQL Query Count</div>
              <div className="text-2xl font-bold">{analytics.sql.count}</div>
            </CardBody>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <CardBody className="p-4">
              <div className="text-sm text-gray-500">
                Average Execution Time
              </div>
              <div className="text-2xl font-bold">
                {formatDuration(analytics.sql.avgTime)}
              </div>
            </CardBody>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <CardBody className="p-4">
              <div className="text-sm text-gray-500">Max Execution Time</div>
              <div className="text-2xl font-bold">
                {formatDuration(analytics.sql.maxTime)}
              </div>
            </CardBody>
          </Card>
        </div>

        <h3 className="text-lg font-medium mt-6 mb-2">SQL Queries</h3>
        {analytics.sql.queries.map((sql, index) => (
          <Card
            key={`${sql.spanId}-${index}`}
            className="mb-3 cursor-pointer hover: dark:hover:bg-gray-750"
            isPressable
            as={Link}
            onPress={() => {
              copyToClipboard(sql.query);
            }}
          >
            <CardBody className="p-3">
              <div className="flex justify-between mb-1">
                <div className="flex items-center">
                  <Database size={14} className="mr-1 text-blue-500" />
                  <span className="text-sm font-medium">SQL Query</span>
                </div>
                <Badge>{formatDuration(sql.time)}</Badge>
              </div>
              <pre className="text-xs   p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
                {sql.query.length > 300
                  ? sql.query.substring(0, 300) + "..."
                  : sql.query}
              </pre>
              <div className="flex justify-end mt-1">
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => onSelectSpan(sql.spanId)}
                  endContent={<ChevronRight size={14} />}
                >
                  View Details
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  };

  // HTTP tab content
  const renderHttpTab = () => {
    if (analytics.http.count === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          No HTTP/URL related information found
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 dark:bg-green-900/20">
            <CardBody className="p-4">
              <div className="text-sm text-gray-500">HTTP Request Count</div>
              <div className="text-2xl font-bold">{analytics.http.count}</div>
            </CardBody>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/20">
            <CardBody className="p-4">
              <div className="text-sm text-gray-500">HTTP Methods</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(analytics.http.byMethod).map(
                  ([method, count]) => (
                    <Badge key={method} color="success" variant="flat">
                      {method}: {count}
                    </Badge>
                  )
                )}
              </div>
            </CardBody>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/20">
            <CardBody className="p-4">
              <div className="text-sm text-gray-500">Status Codes</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(analytics.http.byStatusCode).map(
                  ([code, count]) => (
                    <Chip
                      key={code}
                      color={getStatusCodeColor(code)}
                      variant="flat"
                    >
                      {code}: {count}
                    </Chip>
                  )
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <h3 className="text-lg font-medium mt-6 mb-2">URL List</h3>
        {analytics.http.urls.map((http, index) => (
          <Card
            key={`${http.spanId}-${index}`}
            className="mb-3 cursor-pointer hover: dark:hover:bg-gray-750"
            isPressable
            onPress={() => onSelectSpan(http.spanId)}
          >
            <CardBody className="p-3">
              <div className="flex justify-between mb-1">
                <div className="flex items-center">
                  <Globe size={14} className="mr-1 text-green-500" />
                  <span className="text-sm font-medium">
                    {http.method} Request
                  </span>
                </div>
                {http.statusCode && (
                  <Badge color={getStatusCodeColor(http.statusCode)}>
                    {http.statusCode}
                  </Badge>
                )}
              </div>
              <div className="text-sm font-mono   p-2 rounded-md break-all">
                {http.url}
              </div>
              <div className="flex justify-end mt-1">
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => onSelectSpan(http.spanId)}
                  endContent={<ChevronRight size={14} />}
                >
                  View Details
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  };

  // Errors tab content
  const renderErrorsTab = () => {
    if (analytics.errors.count === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          No error information found
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <Card className="bg-red-50 dark:bg-red-900/20">
          <CardBody className="p-4">
            <div className="text-sm text-gray-500">Total Errors</div>
            <div className="text-2xl font-bold">{analytics.errors.count}</div>
          </CardBody>
        </Card>

        <h3 className="text-lg font-medium mt-6 mb-2">Error Messages</h3>
        {analytics.errors.messages.map((error, index) => (
          <Card
            key={`${error.spanId}-${index}`}
            className="mb-3 cursor-pointer hover: dark:hover:bg-gray-750"
            isPressable
            onPress={() => onSelectSpan(error.spanId)}
          >
            <CardBody className="p-3">
              <div className="flex items-center mb-1">
                <AlertTriangle size={14} className="mr-1 text-red-500" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Error
                </span>
              </div>
              <div className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-md text-red-700 dark:text-red-300">
                {error.message}
              </div>
              <div className="flex justify-end mt-1">
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={() => onSelectSpan(error.spanId)}
                  endContent={<ChevronRight size={14} />}
                >
                  View Details
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  };

  // Services tab content
  const renderServicesTab = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium mb-2">Service Statistics</h3>
        <Table aria-label="Service statistics" removeWrapper>
          <TableHeader>
            <TableColumn>Service</TableColumn>
            <TableColumn align="center">Span Count</TableColumn>
            <TableColumn align="center">Error Count</TableColumn>
            <TableColumn align="end">Average Latency</TableColumn>
          </TableHeader>
          <TableBody>
            {sortedServices.map(([service, stats]) => (
              <TableRow
                key={service}
                className="border-b hover: dark:hover:bg-gray-750"
              >
                <TableCell>
                  <Badge color="primary" variant="flat">
                    {service}
                  </Badge>
                </TableCell>
                <TableCell align="center">{stats.count}</TableCell>
                <TableCell align="center">
                  {stats.errorCount > 0 ? (
                    <Badge color="danger">{stats.errorCount}</Badge>
                  ) : (
                    <Badge color="success">0</Badge>
                  )}
                </TableCell>
                <TableCell align="right" className="font-mono">
                  {formatDuration(stats.avgDuration)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Latency tab content
  const renderLatencyTab = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium mb-2">Top Latency Spans</h3>
        <Table aria-label="Top latency spans" removeWrapper>
          <TableHeader>
            <TableColumn>Name</TableColumn>
            <TableColumn align="center">Service</TableColumn>
            <TableColumn align="end">Latency</TableColumn>
            <TableColumn align="center">Details</TableColumn>
          </TableHeader>
          <TableBody>
            {analytics.topLatencySpans.map((span) => (
              <TableRow
                key={span.spanId}
                className="border-b hover: dark:hover:bg-gray-750"
              >
                <TableCell className="font-mono text-sm">
                  <Tooltip content={span.name}>
                    <span className="truncate block max-w-xs">
                      {span.name.length > 50
                        ? span.name.substring(0, 50) + "..."
                        : span.name}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Badge color="primary" variant="flat">
                    {span.serviceName}
                  </Badge>
                </TableCell>
                <TableCell align="right" className="font-mono">
                  {formatDuration(span.duration)}
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    onPress={() => onSelectSpan(span.spanId)}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center px-4 py-3   border-b">
        <h2 className="text-lg font-medium">Trace Analysis Summary</h2>

        {onToggleView && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              onPress={() => onToggleView("timeline")}
              startContent={<Clock size={14} />}
            >
              Timeline View
            </Button>
            <Button
              size="sm"
              variant="flat"
              onPress={() => onToggleView("list")}
              startContent={<Filter size={14} />}
            >
              Span List View
            </Button>
          </div>
        )}
      </CardHeader>

      <CardBody className="p-0">
        <Tabs aria-label="Trace analysis tabs">
          <Tab
            key="sql"
            title={
              <div className="flex items-center">
                <Database size={16} className="mr-1" />
                SQL ({analytics.sql.count})
              </div>
            }
          >
            <div className="p-4">{renderSqlTab()}</div>
          </Tab>
          <Tab
            key="http"
            title={
              <div className="flex items-center">
                <Globe size={16} className="mr-1" />
                HTTP ({analytics.http.count})
              </div>
            }
          >
            <div className="p-4">{renderHttpTab()}</div>
          </Tab>
          <Tab
            key="errors"
            title={
              <div className="flex items-center">
                <AlertTriangle size={16} className="mr-1" />
                Errors ({analytics.errors.count})
              </div>
            }
          >
            <div className="p-4">{renderErrorsTab()}</div>
          </Tab>
          <Tab
            key="services"
            title={
              <div className="flex items-center">
                <Code size={16} className="mr-1" />
                Services ({Object.keys(analytics.byService).length})
              </div>
            }
          >
            <div className="p-4">{renderServicesTab()}</div>
          </Tab>
          <Tab
            key="latency"
            title={
              <div className="flex items-center">
                <BarChart2 size={16} className="mr-1" />
                Latency
              </div>
            }
          >
            <div className="p-4">{renderLatencyTab()}</div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
};

export default TraceAnalyticsSummary;
