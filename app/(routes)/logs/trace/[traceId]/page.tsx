"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ThemeSwitch } from "@/components/shared/theme-switch";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { useFilterStore } from "@/lib/store/telemetryStore";
import { useLogData } from "@/lib/hooks/useLogData";
import LogFilter from "@/components/logs/LogFilter";
import LogVisualization from "@/components/logs/LogVisualization";

export default function TraceLogsPage({
  params,
}: {
  params: { traceId: string };
}) {
  const router = useRouter();
  const traceId = params.traceId;

  // 스토어 상태와 액션 가져오기
  const { isRealtime, toggleRealtime } = useFilterStore();

  // 통합된 로그 데이터 훅 사용
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
    traceId,
    hasTrace: true,
    autoRefresh: isRealtime,
  });

  // 로그 선택 처리
  const handleLogSelect = useCallback(
    (log: LogItem) => {
      setSelectedLogId(log.id);
    },
    [setSelectedLogId]
  );

  // 선택된 로그 가져오기
  const selectedLog = logs.find((log) => log.id === selectedLogId) || null;

  // 트레이스 보기 처리
  const handleViewTrace = useCallback(() => {
    router.push(`/traces/${traceId}`);
  }, [router, traceId]);

  // 뒤로 가기 처리
  const handleBack = useCallback(() => {
    router.push("/logs");
  }, [router]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="w-full max-w-7xl">
        <div className="flex items-center mb-4">
          <Button
            variant="light"
            onPress={handleBack}
            startContent={<ArrowLeft size={16} />}
          >
            모든 로그로 돌아가기
          </Button>
          <ThemeSwitch className="ml-auto" />
        </div>

        <Card className="mb-4">
          <CardHeader>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold">트레이스 관련 로그</h1>
              <div className="flex items-center mt-2">
                <code className="font-mono text-sm px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                  {traceId}
                </code>
                <Button
                  color="primary"
                  variant="light"
                  className="ml-4"
                  onPress={handleViewTrace}
                >
                  트레이스 상세 보기
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-gray-500">
              이 트레이스 ID와 연관된 로그를 보여줍니다
            </p>
          </CardBody>
        </Card>

        <LogFilter
          services={services}
          severities={severities}
          filters={filters}
          updateFilters={updateFilters}
          onFilterChange={refresh}
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
          트레이스 ID: {traceId.substring(0, 8)}... 관련 총 {totalCount}개 로그
          중 {logs.length}개 표시
          {isRealtime && (
            <span className="ml-2 text-blue-500">(실시간 업데이트 활성화)</span>
          )}
        </div>
      </div>
    </section>
  );
}
