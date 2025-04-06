// frontend/components/traces/TraceList.tsx
"use client";
import React, { useCallback, useMemo, useState } from "react";
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
import { EyeIcon, SearchIcon, Clock, XIcon } from "lucide-react";
import { Card, CardBody } from "@heroui/card";

import { useFilterStore, TraceItem } from "@/lib/store/telemetryStore";

interface TraceListProps {
  traces: TraceItem[];
  onSelectTrace: (trace: TraceItem) => void;
  isLoading?: boolean;
}

const TraceList: React.FC<TraceListProps> = ({
  traces,
  onSelectTrace,
  isLoading = false,
}) => {
  const { traceFilters, setTraceFilters } = useFilterStore();
  const [searchInput, setSearchInput] = useState(traceFilters.search || "");

  // 상태에 따른 배지 색상
  const getStatusBadgeColor = useCallback((status: string | undefined) => {
    const statusMap: Record<string, string> = {
      ERROR: "bg-red-500",
      OK: "bg-green-500",
      UNSET: "bg-gray-500",
    };

    return statusMap[status || "UNSET"] || "bg-gray-500";
  }, []);

  // 필터링된 트레이스
  const filteredTraces = useMemo(() => {
    if (!traces) return [];

    return traces.filter((trace) => {
      // 서비스명 필터
      if (traceFilters.service && trace.serviceName !== traceFilters.service) {
        return false;
      }

      // 상태 필터
      if (traceFilters.status && trace.status !== traceFilters.status) {
        return false;
      }

      // 지연 시간 필터
      if (
        traceFilters.minDuration !== undefined &&
        trace.duration < traceFilters.minDuration
      ) {
        return false;
      }

      if (
        traceFilters.maxDuration !== undefined &&
        trace.duration > traceFilters.maxDuration
      ) {
        return false;
      }

      // 검색어 필터
      if (traceFilters.search) {
        const searchLower = traceFilters.search.toLowerCase();

        return (
          (trace.name && trace.name.toLowerCase().includes(searchLower)) ||
          (trace.serviceName &&
            trace.serviceName.toLowerCase().includes(searchLower)) ||
          (trace.traceId && trace.traceId.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [traces, traceFilters]);

  // 검색 제출 핸들러
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setTraceFilters({ search: searchInput });
    },
    [searchInput, setTraceFilters],
  );

  // 상태 필터 토글
  const toggleStatusFilter = useCallback(
    (status: string) => {
      setTraceFilters({
        status: traceFilters.status === status ? null : status,
      });
    },
    [traceFilters.status, setTraceFilters],
  );

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setTraceFilters({
      service: null,
      status: null,
      search: "",
      minDuration: undefined,
      maxDuration: undefined,
    });
    setSearchInput("");
  }, [setTraceFilters]);

  // 시간 포맷팅
  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  }, []);

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

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <CardBody className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white rounded-lg shadow-lg">
      {/* 필터 섹션 */}
      <div className="p-4 border-b">
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
                placeholder="이름, 서비스 또는 트레이스 ID 검색..."
                aria-label="검색"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <Button
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                  variant="ghost"
                  aria-label="검색어 지우기"
                  size="sm"
                  onPress={() => {
                    setSearchInput("");
                    if (traceFilters.search) {
                      setTraceFilters({ search: "" });
                    }
                  }}
                >
                  <XIcon size={16} />
                </Button>
              )}
            </div>
          </form>

          <div className="flex flex-wrap gap-2 items-center">
            {/* 상태 필터 */}
            <div className="flex gap-1 items-center">
              <span className="text-sm text-gray-500 mr-1">상태:</span>
              {["ERROR", "OK"].map((status) => (
                <Badge
                  key={status}
                  className={`cursor-pointer ${
                    traceFilters.status === status
                      ? getStatusBadgeColor(status)
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => toggleStatusFilter(status)}
                >
                  {status}
                </Badge>
              ))}
            </div>

            {/* 필터 초기화 */}
            {(traceFilters.service ||
              traceFilters.status ||
              traceFilters.search ||
              traceFilters.minDuration !== undefined ||
              traceFilters.maxDuration !== undefined) && (
              <Button
                className="whitespace-nowrap"
                size="sm"
                onPress={resetFilters}
              >
                필터 초기화
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 트레이스 테이블 */}
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <Table
            isHeaderSticky
            aria-label="트레이스 목록"
            bottomContent={
              <div className="text-right px-2 py-2">
                총 {filteredTraces.length}개 트레이스 표시 중
              </div>
            }
            isStriped={false}
          >
            <TableHeader>
              <TableColumn key="time">시간</TableColumn>
              <TableColumn key="status">상태</TableColumn>
              <TableColumn key="service">서비스</TableColumn>
              <TableColumn key="name">이름</TableColumn>
              <TableColumn key="duration">지연 시간</TableColumn>
              <TableColumn key="actions">동작</TableColumn>
            </TableHeader>
            <TableBody
              items={filteredTraces}
              emptyContent={
                <div className="py-8 text-center text-gray-500">
                  표시할 트레이스가 없습니다.
                </div>
              }
            >
              {(trace) => (
                <TableRow
                  key={trace.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectTrace(trace)}
                >
                  <TableCell>{formatTime(trace.startTime)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(trace.status)}>
                      {trace.status || "UNSET"}
                    </Badge>
                  </TableCell>
                  <TableCell className="truncate max-w-[8rem]">
                    {trace.serviceName}
                  </TableCell>
                  <TableCell className="truncate max-w-[32rem]">
                    {trace.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="mr-1 text-gray-500" size={14} />
                      {formatDuration(trace.duration)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      onPress={() => onSelectTrace(trace)}
                    >
                      <EyeIcon className="text-gray-600" size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardBody>
    </Card>
  );
};

export default TraceList;
