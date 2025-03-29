"use client";
import React, { useState, useCallback, useMemo } from "react";
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
import { EyeIcon, FilterIcon, SearchIcon, XIcon } from "lucide-react";
import { Card, CardBody } from "@heroui/card";

import { useFilterStore, LogItem } from "@/lib/store/telemetryStore";

interface LogListProps {
  logs: LogItem[];
  onSelectLog: (log: LogItem) => void;
  isLoading?: boolean;
}

const LogList: React.FC<LogListProps> = ({
  logs,
  onSelectLog,
  isLoading = false,
}) => {
  const { logFilters, setLogFilters } = useFilterStore();
  const [searchInput, setSearchInput] = useState(logFilters.search || "");

  // 심각도에 따른 배지 색상
  const getSeverityBadgeColor = useCallback((severity: string) => {
    const severityMap: Record<string, string> = {
      FATAL: "bg-red-700 hover:bg-red-800",
      ERROR: "bg-red-500 hover:bg-red-600",
      WARN: "bg-yellow-500 hover:bg-yellow-600",
      INFO: "bg-blue-500 hover:bg-blue-600",
      DEBUG: "bg-gray-500 hover:bg-gray-600",
      TRACE: "bg-gray-400 hover:bg-gray-500",
    };

    return severityMap[severity] || "bg-gray-500 hover:bg-gray-600";
  }, []);

  // 필터링된 로그
  const filteredLogs = useMemo(() => {
    if (!logs) return [];

    return logs.filter((log) => {
      // 서비스명 필터
      if (logFilters.service && log.serviceName !== logFilters.service) {
        return false;
      }

      // 심각도 필터
      if (logFilters.severity && log.severity !== logFilters.severity) {
        return false;
      }

      // 트레이스 연결 필터
      if (logFilters.hasTrace && (!log.traceId || log.traceId === "")) {
        return false;
      }

      // 검색어 필터
      if (logFilters.search) {
        const searchLower = logFilters.search.toLowerCase();

        return (
          log.message.toLowerCase().includes(searchLower) ||
          log.serviceName.toLowerCase().includes(searchLower) ||
          (log.traceId && log.traceId.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [logs, logFilters]);

  // 검색 제출 핸들러
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setLogFilters({ search: searchInput });
    },
    [searchInput, setLogFilters],
  );

  // 심각도 필터 토글
  const toggleSeverityFilter = useCallback(
    (severity: string) => {
      setLogFilters({
        severity: logFilters.severity === severity ? null : severity,
      });
    },
    [logFilters.severity, setLogFilters],
  );

  // 트레이스 연결 필터 토글
  const toggleTraceFilter = useCallback(() => {
    setLogFilters({ hasTrace: !logFilters.hasTrace });
  }, [logFilters.hasTrace, setLogFilters]);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setLogFilters({
      service: null,
      severity: null,
      search: "",
      hasTrace: false,
    });
    setSearchInput("");
  }, [setLogFilters]);

  // 시간 포맷팅
  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  }, []);

  return (
    <Card>
      {/* 필터 섹션 */}
      <h2 className="p-4 border-b">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <form
            className="flex-1 w-full md:w-auto"
            onSubmit={handleSearchSubmit}
          >
            <div className="relative">
              <SearchIcon
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="메시지, 서비스 또는 트레이스 ID 검색..."
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    if (logFilters.search) {
                      setLogFilters({ search: "" });
                    }
                  }}
                >
                  <XIcon size={16} />
                </button>
              )}
            </div>
          </form>

          <div className="flex flex-wrap gap-2 items-center">
            {/* 심각도 필터 */}
            <div className="flex gap-1 items-center">
              <span className="text-sm text-gray-500 mr-1">심각도:</span>
              {["ERROR", "WARN", "INFO", "DEBUG"].map((severity) => (
                <Badge
                  key={severity}
                  className={`cursor-pointer ${
                    logFilters.severity === severity
                      ? getSeverityBadgeColor(severity)
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => toggleSeverityFilter(severity)}
                >
                  {severity}
                </Badge>
              ))}
            </div>

            {/* 트레이스 연결 필터 */}
            <Badge
              className={`cursor-pointer flex items-center gap-1 ${
                logFilters.hasTrace
                  ? "bg-purple-500 hover:bg-purple-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={toggleTraceFilter}
            >
              <FilterIcon size={14} />
              트레이스 있음
            </Badge>

            {/* 필터 초기화 */}
            {(logFilters.service ||
              logFilters.severity ||
              logFilters.search ||
              logFilters.hasTrace) && (
              <Button
                className="whitespace-nowrap"
                size="sm"
                onClick={resetFilters}
              >
                필터 초기화
              </Button>
            )}
          </div>
        </div>
      </h2>

      {/* 로그 테이블 */}
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <Table
            bottomContent={
              <TableRow>
                <TableCell className="text-right" colSpan={5}>
                  총 {filteredLogs.length}개 로그 표시 중
                </TableCell>
              </TableRow>
            }
          >
            <TableHeader>
              <TableRow>
                <TableColumn className="w-48">시간</TableColumn>
                <TableColumn className="w-24">심각도</TableColumn>
                <TableColumn className="w-32">서비스</TableColumn>
                <TableColumn>메시지</TableColumn>
                <TableColumn className="w-24">동작</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell className="text-center py-8" colSpan={5}>
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    </div>
                    <p className="mt-2 text-gray-500">로그를 불러오는 중...</p>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center py-8" colSpan={5}>
                    <p className="text-gray-500">
                      로그가 없거나 필터 조건에 맞는 로그가 없습니다.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelectLog(log)}
                  >
                    <TableCell className="whitespace-nowrap">
                      {formatTime(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityBadgeColor(log.severity)}>
                        {log.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="truncate max-w-[8rem]">
                      {log.serviceName}
                    </TableCell>
                    <TableCell className="truncate max-w-[32rem]">
                      {log.message}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" onPress={() => onSelectLog(log)}>
                        <EyeIcon className="text-gray-600" size={18} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardBody>
    </Card>
  );
};

export default LogList;
