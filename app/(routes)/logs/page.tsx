"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ThemeSwitch } from "@/components/shared/theme-switch";
import DateRangePicker from "@/components/shared/DateRangePicker";
import { useFilterStore } from "@/lib/store/telemetryStore";
import { Button } from "@heroui/button";
import { RefreshCw } from "lucide-react";
import LogFilter from "@/components/logs/LogFilter";
import LogVisualization from "@/components/logs/LogVisualization";
import { useLogData } from "@/lib/hooks/useLogData";

export default function LogsPage() {
  const router = useRouter();
  const { isRealtime, toggleRealtime, setTimeRange } = useFilterStore();
  const {
    logs,
    isLoading,
    error,
    totalCount,
    currentPage,
    setCurrentPage,
    services,
    severities,
    filters,
    updateFilters,
    refresh,
    selectedLogId,
    setSelectedLogId,
  } = useLogData({
    autoRefresh: isRealtime,
  });

  // 시간 범위 변경 처리
  const handleTimeRangeChange = useCallback(
    (startTime: number, endTime: number) => {
      setTimeRange(startTime, endTime);
      refresh();
    },
    [setTimeRange, refresh]
  );

  // 필터 변경 처리
  const handleFilterChange = useCallback(() => {
    refresh();
  }, [refresh]);

  // 로그 선택 처리
  const handleLogSelect = useCallback(
    (log: LogItem) => {
      setSelectedLogId(log.id);
    },
    [setSelectedLogId]
  );

  const selectedLog = logs.find((log) => log.id === selectedLogId) || null;
  const handleViewTrace = useCallback(
    (traceId: string) => {
      router.push(`/traces/${traceId}`);
    },
    [router]
  );

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <ThemeSwitch className="absolute top-4 right-4" />

      <div className="w-full max-w-7xl">
        <div className="flex justify-between items-center mb-4">
          <DateRangePicker
            onChange={handleTimeRangeChange}
            isDisabled={isRealtime}
          />

          <Button
            variant="light"
            onPress={refresh}
            isDisabled={isRealtime || isLoading}
            startContent={<RefreshCw size={16} />}
          >
            새로고침
          </Button>
        </div>

        <LogFilter
          services={services}
          severities={severities}
          filters={filters}
          updateFilters={updateFilters}
          onFilterChange={handleFilterChange}
          onRefresh={refresh}
          isRealtime={isRealtime}
          onToggleRealtime={toggleRealtime}
        />

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
            <p className="font-medium">
              로그를 불러오는 중 오류가 발생했습니다
            </p>
            <p className="text-sm mt-1">{error.message}</p>
            <Button
              color="primary"
              variant="light"
              className="mt-2"
              onPress={() => refresh()}
            >
              다시 시도
            </Button>
          </div>
        )}

        <LogVisualization
          logs={logs}
          isLoading={isLoading}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={filters.limit}
          onPageChange={setCurrentPage}
          onSelectLog={handleLogSelect}
          selectedLog={selectedLog}
          onViewTrace={handleViewTrace}
        />

        <div className="mt-4 text-sm text-gray-500 text-right">
          총 {totalCount}개 로그 중 {logs.length}개 표시
          {isRealtime && (
            <span className="ml-2 text-blue-500">(실시간 업데이트 활성화)</span>
          )}
        </div>
      </div>
    </section>
  );
}
