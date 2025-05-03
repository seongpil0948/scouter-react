"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerBody,
  DrawerHeader,
} from "@heroui/drawer";
import { X, BarChart2, ListFilter, Clock, RefreshCw } from "lucide-react";

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
import { useTraceDataStore } from "@/lib/store/traceDataStore";

export default function TracesPage() {
  const router = useRouter();

  // Drawer and tabs state
  const [activeTab, setActiveTab] = useState<string>("list");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // Manual refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Time range change debounce
  const timeRangeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const filterChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stores
  const { setTimeRange } = useFilterStore();
  const { setSelectedTraceId, selectedTraceId } = useTraceDataStore();

  // Use enhanced trace data hook
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

  // Log current time range
  useEffect(() => {
    console.log("[TracesPage] Current time range:", {
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

  // Trace selection handler
  const handleTraceClick = useCallback(
    (trace: TraceItem) => {
      setSelectedTraceId(trace.traceId);
      onOpen(); // Open drawer
    },
    [setSelectedTraceId, onOpen]
  );

  // Time range change handler
  const handleTimeRangeChange = useCallback(
    (startTime: number, endTime: number) => {
      // Debounce time range changes
      if (isRefreshing) return;

      // Clear previous timeout
      if (timeRangeChangeTimeoutRef.current) {
        clearTimeout(timeRangeChangeTimeoutRef.current);
      }

      console.log(
        "[TracesPage] Time range change requested:",
        new Date(startTime).toLocaleString(),
        new Date(endTime).toLocaleString()
      );

      // Set time range with short delay
      timeRangeChangeTimeoutRef.current = setTimeout(() => {
        setTimeRange(startTime, endTime);
        refresh();
        timeRangeChangeTimeoutRef.current = null;
      }, 300);
    },
    [refresh, isRefreshing, setTimeRange]
  );

  // Filter change handler
  const handleFilterChange = useCallback(() => {
    // Debounce filter changes
    if (filterChangeTimeoutRef.current) {
      clearTimeout(filterChangeTimeoutRef.current);
    }

    // Refresh data with short delay
    filterChangeTimeoutRef.current = setTimeout(() => {
      console.log("[TracesPage] Filters changed, refreshing data");
      refresh();
      filterChangeTimeoutRef.current = null;
    }, 300);
  }, [refresh]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    console.log("[TracesPage] Manual refresh triggered");

    refresh().finally(() => {
      setTimeout(() => setIsRefreshing(false), 500);
    });
  }, [refresh, isRefreshing]);

  // Clean up timeouts on unmount
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
          isDisabled={isRealtime || (isLoading && traces?.length === 0)}
        />

        <Button
          variant="light"
          onPress={handleManualRefresh}
          isDisabled={isRealtime || isLoading}
          isLoading={isRefreshing}
          startContent={<RefreshCw size={16} />}
        >
          새로고침
        </Button>
      </div>

      <div className="w-full max-w-7xl space-y-4">
        {/* Filter component */}
        <TraceFilter
          onFilterChange={handleFilterChange}
          onRefresh={handleManualRefresh}
        />

        {/* Error state */}
        {error && (
          <Card>
            <CardBody className="p-8 text-center text-red-500">
              <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
              <p className="text-sm text-gray-500 mt-2">{error.message}</p>
              <Button
                color="primary"
                variant="light"
                className="mt-4"
                onPress={handleManualRefresh}
              >
                다시 시도
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Tabs */}
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
            {/* List tab */}
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

            {/* Analytics tab */}
            {activeTab === "analytics" && traces.length > 0 && (
              <TraceAnalytics
                traces={traces}
                onTraceSelect={(traceId) =>
                  handleTraceClick(
                    traces.find((t: any) => t.traceId === traceId) || traces[0]
                  )
                }
              />
            )}

            {/* Empty analytics state */}
            {activeTab === "analytics" &&
              traces?.length === 0 &&
              !isLoading && (
                <div className="text-center py-12 text-gray-500">
                  <p>분석할 데이터가 없습니다.</p>
                  <p className="text-sm mt-2">
                    필터를 조정하여 더 많은 데이터를 불러오세요.
                  </p>
                </div>
              )}

            {/* Global loading state */}
            {isLoading && traces?.length === 0 && (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                <p className="ml-4 text-gray-600">데이터를 불러오는 중...</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Status info */}
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

      {/* Trace detail drawer */}
      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="xl"
        placement="right"
        classNames={{
          base: "max-w-[90%] sm:max-w-[800px]",
          body: "p-0", // Remove padding for full TraceDetail display
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
