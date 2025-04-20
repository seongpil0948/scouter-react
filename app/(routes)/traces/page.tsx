"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerBody,
  DrawerHeader,
} from "@heroui/drawer";
import { X, BarChart2, ListFilter, ClockIcon } from "lucide-react";

import DateRangePicker from "@/components/shared/DateRangePicker";
import { ThemeSwitch } from "@/components/shared/theme-switch";
import TraceFilter from "@/components/traces/TraceFilter";
import { Card, CardBody } from "@heroui/card";
import TraceTable from "@/components/traces/TraceTable";
import TraceDetail from "@/components/traces/TraceDetail";
import TraceAnalytics from "@/components/traces/TraceVisualization/TraceAnalytics";
import { useTraceData } from "@/lib/hooks/useTraceData";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/modal";
import { Tabs, Tab } from "@heroui/tabs";
import { useFilterStore } from "@/lib/store/telemetryStore";

export default function TracesPage() {
  const router = useRouter();
  // 드로어 및 탭 관련 상태
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [activeTab, setActiveTab] = useState<string>("list");

  // 시간 범위 변경 관련 상태
  const [isChangingTimeRange, setIsChangingTimeRange] = useState(false);
  const timeRangeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const filterChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 필터 스토어 접근
  const { setTimeRange } = useFilterStore();

  // useTraceData 커스텀 훅 사용
  const {
    traces,
    error,
    isLoading,
    isValidating,
    refresh,
    currentPage,
    setCurrentPage,
    totalCount,
    timeRange,
    isRealtime,
  } = useTraceData({
    rootSpansOnly: true,
  });

  // 날짜 범위 변경 감지 로그
  useEffect(() => {
    console.log("[TracesPage] 현재 시간 범위:", {
      startTime:
        timeRange.startTime > 0
          ? new Date(timeRange.startTime).toLocaleString()
          : "unset",
      endTime:
        timeRange.endTime > 0
          ? new Date(timeRange.endTime).toLocaleString()
          : "unset",
    });
  }, [timeRange]);

  // 트레이스 클릭 핸들러 - Drawer 사용
  const handleTraceClick = useCallback(
    (trace: TraceItem) => {
      setSelectedTraceId(trace.traceId);
      onOpen(); // Drawer 열기
    },
    [onOpen]
  );

  // 시간 범위 변경 핸들러 - 디바운싱 적용
  const handleTimeRangeChange = useCallback(
    (startTime: number, endTime: number) => {
      // 중복/빠른 연속 호출 방지
      if (isChangingTimeRange) return;
      setIsChangingTimeRange(true);

      console.log(
        "[TracesPage] 시간 범위 변경 요청:",
        new Date(startTime).toLocaleString(),
        new Date(endTime).toLocaleString()
      );

      // 이전 타이머 정리
      if (timeRangeChangeTimeoutRef.current) {
        clearTimeout(timeRangeChangeTimeoutRef.current);
      }
      // 전역 시간 범위 업데이트 (이미 DateRangePicker에서 수행했을 수 있음)
      setTimeRange(startTime, endTime);

      // 데이터 리프레시 전 약간의 지연 추가
      timeRangeChangeTimeoutRef.current = setTimeout(() => {
        refresh();
        setIsChangingTimeRange(false);
        timeRangeChangeTimeoutRef.current = null;
      }, 300);

      // 컴포넌트 언마운트 시 타이머 정리
      return () => {
        if (timeRangeChangeTimeoutRef.current) {
          clearTimeout(timeRangeChangeTimeoutRef.current);
          timeRangeChangeTimeoutRef.current = null;
        }
      };
    },
    [refresh, isRealtime, isChangingTimeRange, setTimeRange]
  );

  // 필터 변경 핸들러 - 디바운싱 적용
  const handleFilterChange = useCallback(() => {
    // 이미 타이머가 설정되어 있으면 제거
    if (filterChangeTimeoutRef.current) {
      clearTimeout(filterChangeTimeoutRef.current);
    }

    // 필터 변경 시 약간의 지연 후 데이터 갱신
    filterChangeTimeoutRef.current = setTimeout(() => {
      console.log("[TracesPage] 필터 변경으로 데이터 리프레시");
      refresh();
      filterChangeTimeoutRef.current = null;
    }, 300);
  }, [refresh]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeRangeChangeTimeoutRef.current) {
        clearTimeout(timeRangeChangeTimeoutRef.current);
      }
      if (filterChangeTimeoutRef.current) {
        clearTimeout(filterChangeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className="text-2xl font-bold">트레이스 목록</h1>
        <p className="text-gray-500 text-sm mt-1">
          분산 트레이스 데이터를 시간, 서비스, 상태 등으로 필터링하여 조회할 수
          있습니다.
        </p>
      </div>

      <ThemeSwitch className="absolute top-4 right-4" />

      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-7xl">
        <DateRangePicker
          onChange={handleTimeRangeChange}
          isDisabled={isRealtime || (isLoading && traces.length === 0)}
        />
      </div>

      <div className="w-full max-w-7xl space-y-4">
        {/* 필터 컴포넌트 */}
        <TraceFilter onFilterChange={handleFilterChange} onRefresh={refresh} />

        {/* 오류 상태 */}
        {error && (
          <Card>
            <CardBody className="p-8 text-center text-red-500">
              <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
              <p className="text-sm text-gray-500 mt-2">{error.message}</p>
              <Button
                color="primary"
                variant="light"
                className="mt-4"
                onPress={refresh}
              >
                다시 시도
              </Button>
            </CardBody>
          </Card>
        )}

        {/* 탭 뷰 추가 */}
        <Card className="w-full">
          <Tabs
            aria-label="트레이스 보기 모드"
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="px-4 pt-2"
          >
            <Tab
              key="list"
              title={
                <div className="flex items-center">
                  <ListFilter size={16} className="mr-1" />
                  목록 보기
                </div>
              }
            />
            <Tab
              key="analytics"
              title={
                <div className="flex items-center">
                  <BarChart2 size={16} className="mr-1" />
                  분석 보기
                </div>
              }
            />
          </Tabs>

          <CardBody className="p-4">
            {/* 목록 탭 */}
            {activeTab === "list" && (
              <TraceTable
                traces={traces}
                isLoading={isLoading}
                totalCount={totalCount}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onSelectTrace={handleTraceClick}
                pageSize={100}
              />
            )}

            {/* 분석 탭 */}
            {activeTab === "analytics" && traces.length > 0 && (
              <TraceAnalytics
                traces={traces}
                onTraceSelect={(traceId) =>
                  handleTraceClick(
                    traces.find((t) => t.traceId === traceId) || traces[0]
                  )
                }
              />
            )}

            {/* 분석 탭인데 데이터가 없는 경우 */}
            {activeTab === "analytics" && traces.length === 0 && !isLoading && (
              <div className="text-center py-12 text-gray-500">
                <p>분석할 데이터가 없습니다.</p>
                <p className="text-sm mt-2">
                  필터를 조정하여 더 많은 데이터를 불러오세요.
                </p>
              </div>
            )}

            {/* 로딩 중인 경우 */}
            {isLoading && traces.length === 0 && (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                <p className="ml-4 text-gray-600">데이터를 불러오는 중...</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* 표시 정보 */}
        <div className="text-sm text-gray-500 text-right">
          총 {totalCount}개의 트레이스 중 {traces.length}개 표시 중
          {isRealtime && (
            <span className="ml-2 text-blue-500">(실시간 갱신 중)</span>
          )}
          {isValidating && !isLoading && (
            <span className="ml-2">(데이터 갱신 중...)</span>
          )}
        </div>
      </div>

      {/* 트레이스 상세 정보 Drawer */}
      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="xl"
        placement="right"
        classNames={{
          base: "max-w-[90%] sm:max-w-[800px]",
          body: "p-0", // 패딩 제거하여 TraceDetail이 온전히 표시되도록
        }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex justify-between items-center border-b p-4">
                <div className="flex items-center gap-2">
                  <Button
                    title="닫기"
                    variant="light"
                    isIconOnly
                    onPress={onClose}
                  >
                    <X size={18} />
                  </Button>
                  <h2 className="text-xl">트레이스 상세</h2>
                </div>
              </DrawerHeader>
              <DrawerBody>
                {selectedTraceId && (
                  <TraceDetail traceId={selectedTraceId} onBack={onClose} />
                )}
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </section>
  );
}
