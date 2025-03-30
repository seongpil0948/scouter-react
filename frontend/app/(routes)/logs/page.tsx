// frontend/app/(routes)/logs/page.tsx
"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";

import {
  useFilterStore,
  useTelemetryStore,
  LogItem,
} from "@/lib/store/telemetryStore";
import Header from "@/components/layout/Header";
import LogList from "@/components/logs/LogList";
import LogDetail from "@/components/logs/LogDetail";
import LogVisualization from "@/components/logs/LogVisualization";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LogsPage() {
  const router = useRouter();
  const { logFilters, timeRange } = useFilterStore();
  const { setIsLoadingLogs, isLoadingLogs } = useTelemetryStore();
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [viewMode, setViewMode] = useState<"list" | "visualization">("list");

  // 로그 목록 가져오기
  const { data, error, isLoading } = useSWR(
    `/api/telemetry/logs?startTime=${timeRange.startTime}&endTime=${timeRange.endTime}${
      logFilters.service ? `&serviceName=${logFilters.service}` : ""
    }${logFilters.severity ? `&severity=${logFilters.severity}` : ""}${
      logFilters.hasTrace ? `&hasTrace=true` : ""
    }${logFilters.search ? `&query=${encodeURIComponent(logFilters.search)}` : ""}`,
    fetcher,
    { refreshInterval: 30000 }, // 30초마다 자동 갱신
  );

  // 로딩 상태 업데이트
  useEffect(() => {
    setIsLoadingLogs(isLoading);
  }, [isLoading, setIsLoadingLogs]);

  // 로그 목록 데이터 처리
  useEffect(() => {
    if (data && data.logs) {
      setLogs(data.logs);
    }
  }, [data]);

  // 로그 선택 핸들러
  const handleSelectLog = (log: LogItem) => {
    setSelectedLog(log);
    setSelectedIndex(logs.findIndex((l) => l.id === log.id));
  };

  // 닫기 핸들러
  const handleClose = () => {
    setSelectedLog(null);
    setSelectedIndex(-1);
  };

  // 트레이스 보기 핸들러
  const handleViewTrace = (traceId: string) => {
    router.push(`/traces/${traceId}`);
  };

  // 다음 로그 보기 핸들러
  const handleViewNext = () => {
    if (selectedIndex < logs.length - 1) {
      const nextLog = logs[selectedIndex + 1];

      setSelectedLog(nextLog);
      setSelectedIndex(selectedIndex + 1);
    }
  };

  // 이전 로그 보기 핸들러
  const handleViewPrevious = () => {
    if (selectedIndex > 0) {
      const prevLog = logs[selectedIndex - 1];

      setSelectedLog(prevLog);
      setSelectedIndex(selectedIndex - 1);
    }
  };

  // 뷰 모드 전환 핸들러
  const toggleViewMode = () => {
    setViewMode(viewMode === "list" ? "visualization" : "list");
  };

  return (
    <>
      <Header title="로그 분석" />

      <div className="mb-4 flex justify-end">
        <Button
          className={`px-4 py-2 ${
            viewMode === "list"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onPress={toggleViewMode}
        >
          {viewMode === "list" ? "차트 보기" : "목록 보기"}
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={selectedLog ? "lg:col-span-7" : "lg:col-span-12"}>
          {viewMode === "list" ? (
            <LogList
              isLoading={isLoadingLogs}
              logs={logs}
              onSelectLog={handleSelectLog}
            />
          ) : (
            <LogVisualization
              logData={logs}
              onDataPointClick={handleSelectLog}
              height={600}
              title="로그 발생 패턴 시각화"
            />
          )}
        </div>

        {selectedLog && (
          <div className="lg:col-span-5">
            <LogDetail
              hasNext={selectedIndex < logs.length - 1}
              hasPrevious={selectedIndex > 0}
              log={selectedLog}
              onClose={handleClose}
              onViewNext={handleViewNext}
              onViewPrevious={handleViewPrevious}
              onViewTrace={handleViewTrace}
            />
          </div>
        )}
      </div>
    </>
  );
}
